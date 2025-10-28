// server/src/modules/product/productVariant.service.js
import mongoose from "mongoose";
import ProductVariant from "./productVariant.model.js";
import Product from "./product.model.js";
import Attribute from "./attribute.model.js";
import AttributeValue from "./attributeValue.model.js";
import Shop from "../shop/shop.model.js";
import fs from "fs";
import path from "path";
import { withTransaction, generateVariantsCombinations} from "../../utils/index.js";

const productUploadDir = path.resolve("src/uploads/products");

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : null);

// Sinh tổ hợp biến thể mới (chưa có trong DB dùng cho việc thêm sp biến thể)
export const generateNewVariantCombinations = async (productId, attributes) => {
  try {
    if (!productId) throw new Error("Thiếu productId");
    if (!Array.isArray(attributes) || attributes.length === 0)
      throw new Error("Danh sách thuộc tính không hợp lệ");

    const product = await Product.findById(productId);
    if (!product) throw new Error("Không tìm thấy sản phẩm");  // Lấy danh sách variantKey đã tồn tại trong DB (đã lưu cho sản phẩm này)
    
    const existingKeys = await ProductVariant.find({ productId }).distinct("variantKey");

    // Sinh tất cả các tổ hợp từ danh sách attribute & value người dùng chọn
    const allCombinations = generateVariantsCombinations(attributes);

    // Giữ lại những tổ hợp chưa có trong DB
    const availableCombinations = allCombinations.filter(
      combo => !existingKeys.includes(combo.variantKey)
    );

    return {
      success: true,
      message: "Sinh tổ hợp biến thể mới thành công",
      data: availableCombinations.map((c) => ({
        attributes: c.attributes, // [{ attributeId, valueId }]
        variantKey: c.variantKey, // ví dụ "1|2"
      })),
    };
  } catch (error) {
    // console.error("generateNewVariantCombinations error:", error);
    return {
      success: false,
      message: error.message || "Lỗi khi sinh tổ hợp biến thể mới",
      data: [],
    };
  }
};

//Lấy danh sách attribute + value (có đánh dấu isUsed) cho 1 sản phẩm (dùng cho việc thêm sp biến thể)
export const getProductAttributesWithValues = async (productId, accountId) => {
   try {
    if (!productId) throw new Error("Thiếu productId");
    if (!accountId) throw new Error("Thiếu accountId của shop");
    
    // Lấy shopId tương ứng với accountId
    const shop = await Shop.findOne({ accountId }).select("_id").lean();
    if (!shop) throw new Error("Không tìm thấy shop tương ứng với tài khoản này");
    const shopId = shop._id;
    
    //Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId).lean();
    if (!product) throw new Error("Không tìm thấy sản phẩm");
    
    // Lấy tất cả các biến thể hiện có
    const variants = await ProductVariant.find({ productId }).lean();

    // Nếu sản phẩm chưa có biến thể
    if (!variants.length) {
      return {
        success: true,
        message: "Sản phẩm chưa có biến thể",
        data: [],
      };
    }

    // Thu thập các attributeId & valueId đã dùng
    const usedAttributeIds = new Set();
    const usedValueIds = new Set();

    variants.forEach((v) => {
      (v.attributes || []).forEach((a) => {
        if (a.attributeId) usedAttributeIds.add(a.attributeId.toString());
        if (a.valueId) usedValueIds.add(a.valueId.toString());
      });
    });

    // Lấy chi tiết attribute và value
    const attributes = await Attribute.find({
      _id: { $in: [...usedAttributeIds] },
    }).lean();

    //Lấy giá trị (value) tương ứng — xử lý khác nhau cho global / shop
    const allAttributeValues = [];

    for (const attr of attributes) {
      let values;

      if (attr.isGlobal) {
        // Attribute toàn cục → lấy value global (shopId=null) và value riêng shop
        values = await AttributeValue.find({
          attributeId: attr._id,
          isActive: true,
          $or: [{ shopId: null }, { shopId }],
        }).lean();
      } else {
        // Attribute của shop → chỉ lấy value thuộc shop đó
        values = await AttributeValue.find({
          attributeId: attr._id,
          shopId,
          isActive: true,
        }).lean();
      }

      allAttributeValues.push(...values);
    }

    // Gom nhóm value theo attribute và đánh dấu isUsed
    const data = attributes.map((attr) => ({
      attributeId: attr._id,
      label: attr.label,
      isGlobal: attr.isGlobal,
      values: attributeValues
        .filter((v) => v.attributeId.toString() === attr._id.toString())
        .map((v) => ({
          valueId: v._id,
          value: v.value,
          image: v.image || "",
          isUsed: usedValueIds.has(v._id.toString()), // FE sẽ disable nếu true
        })),
    }));

    return {
      success: true,
      message: "Lấy danh sách thuộc tính và giá trị thành công",
      data,
    };
  } catch (error) {
    console.error("getProductAttributesWithValues error:", error);
    return {
      success: false,
      message: error.message || "Lỗi khi lấy danh sách thuộc tính và giá trị",
      data: [],
    };
  }
};


/**
 * Tạo nhiều ProductVariant cùng lúc (bulk create)
 *
 * @param {String|ObjectId} productId
 * @param {String|ObjectId} accountId  // để xác định shopId
 * @param {Array} variantsPayload - mỗi phần tử:
 *   {
 *     variantKey: "1|2",                 // chuỗi key (nên có, nếu không có thì backend có thể compute trước khi gọi)
 *     attributes: [{ attributeId, valueId }, ...],
 *     stock?: Number,
 *     priceAdjustment?: Number,
 *     image?: [String]
 *   }
 *
 * @returns { success, message, data } -- data = createdVariants (array)
 */
export const createProductVariantsBulk = async (productId, accountId, variantsPayload = []) => {
  try {
    // --- Validate cơ bản ---
    if (!productId) throw new Error("Thiếu productId");
    if (!accountId) throw new Error("Thiếu accountId");
    if (!Array.isArray(variantsPayload) || variantsPayload.length === 0)
      throw new Error("Danh sách biến thể rỗng hoặc không hợp lệ");

    const productObjectId = toObjectId(productId);
    if (!productObjectId) throw new Error("productId không hợp lệ");

    // --- Lấy shopId từ accountId ---
    const shop = await Shop.findOne({ accountId }).select("_id").lean();
    if (!shop) throw new Error("Không tìm thấy shop tương ứng với tài khoản này");
    const shopId = shop._id;

    // --- Kiểm tra product hợp lệ ---
    const product = await Product.findById(productObjectId).lean();
    if (!product) throw new Error("Không tìm thấy sản phẩm");

    if (product.shopId && product.shopId.toString() !== shopId.toString()) {
      throw new Error("Không có quyền tạo biến thể cho sản phẩm này");
    }

    // --- Kiểm tra variantKey ---
    const payloadKeys = variantsPayload.map((v) => v.variantKey?.trim()).filter(Boolean);
    const dupInPayload = payloadKeys.filter((k, i, arr) => arr.indexOf(k) !== i);
    if (dupInPayload.length) {
      throw new Error(`Tồn tại variantKey trùng trong payload: ${[...new Set(dupInPayload)].join(", ")}`);
    }

    const existingKeys = await ProductVariant.find({ productId: productObjectId }).distinct("variantKey");
    const conflictKeys = payloadKeys.filter((k) => existingKeys.includes(k));
    if (conflictKeys.length) {
      throw new Error(`Các variantKey sau đã tồn tại: ${conflictKeys.join(", ")}`);
    }

    // --- Chuẩn bị dữ liệu insert ---
    const toInsert = variantsPayload.map((v) => ({
      productId: productObjectId,
      variantKey: v.variantKey,
      attributes: v.attributes.map((a) => ({
        attributeId: toObjectId(a.attributeId),
        valueId: toObjectId(a.valueId),
      })),
      stock: typeof v.stock === "number" ? v.stock : 0,
      image: typeof v.image === "string" ? v.image : "",
      priceAdjustment: typeof v.priceAdjustment === "number" ? v.priceAdjustment : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // --- Transaction ---
    let createdDocs = [];
    await withTransaction(async (session) => {
      const exist = await ProductVariant.find({
        productId: productObjectId,
        variantKey: { $in: payloadKeys },
      })
        .session(session)
        .lean();

      if (exist.length) {
        throw new Error(
          `Một số variantKey đã tồn tại: ${exist.map((e) => e.variantKey).join(", ")}`
        );
      }

      const inserted = await ProductVariant.insertMany(toInsert, { session });
      createdDocs = inserted;
    });

    return {
      success: true,
      message: "Tạo biến thể sản phẩm hàng loạt thành công",
      data: createdDocs,
    };
  } catch (error) {
    console.error("createProductVariantsBulk error:", error);
    return {
      success: false,
      message: error.message || "Lỗi khi tạo biến thể sản phẩm hàng loạt",
      data: [],
    };
  }
};

/**
 * Cập nhật 1 biến thể sản phẩm
 * @param {ObjectId} variantId - ID biến thể cần cập nhật
 * @param {Object} payload - dữ liệu cập nhật (stock, image, priceAdjustment)
 * @returns {Object} { success, message, data }
 */
export const updateProductVariant = async (variantId, payload) => {
  return withTransaction(async (session) => {
    if (!variantId) throw new Error("Thiếu ID biến thể cần cập nhật");

    const variant = await ProductVariant.findById(variantId).session(session);
    if (!variant) throw new Error("Không tìm thấy biến thể sản phẩm");

    // --- Kiểm tra dữ liệu đầu vào ---
    const { stock, image, priceAdjustment } = payload;

    if (stock != null && (isNaN(stock) || stock < 0))
      throw new Error("Số lượng phải là số >= 0");

    if (priceAdjustment != null && isNaN(priceAdjustment))
      throw new Error("Giá điều chỉnh không hợp lệ");

    if (image && typeof image !== "string")
      throw new Error("Ảnh biến thể phải là chuỗi (URL hoặc tên file)");

    // --- Cập nhật các trường ---
    if (stock != null) variant.stock = stock;
    if (priceAdjustment != null) variant.priceAdjustment = priceAdjustment;
    if (image) variant.image = image;

    await variant.save({ session });

    return {
      success: true,
      message: "Cập nhật biến thể thành công",
      data: variant,
    };
  });
};