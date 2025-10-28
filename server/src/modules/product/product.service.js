import mongoose from "mongoose";
import ProductVariant from "./productVariant.model.js";
import Product from "./product.model.js";
import Attribute from "./attribute.model.js";
import AttributeValue from "./attributeValue.model.js";
import { createProductVariantsBulk } from "./productVariant.service.js";
import Shop from "../shop/shop.model.js";
import fs from "fs";
import path from "path";
import { withTransaction, generateVariantsCombinations} from "../../utils/index.js";

const productUploadDir = path.resolve("src/uploads/products");
const productTrashDir = path.resolve("src/uploads/trash/products");
if (!fs.existsSync(productTrashDir)) fs.mkdirSync(productTrashDir, { recursive: true });

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : null);

/**
 * Lấy danh sách sản phẩm
 * @param {Object} options
 * @param {String|ObjectId} [options.shopId] - Lọc sản phẩm theo shopId (nếu có)
 * @param {String|ObjectId} [options.accountId] - Nếu không có shopId, có thể truyền accountId để xác định shop
 * @param {Boolean} [options.includeInactive=false] - true => lấy cả sản phẩm ẩn; false => chỉ lấy isActive=true
 * @returns {Object} { success, message, data }
 */
export const getAllProducts = async ({ shopId, accountId, includeInactive = false }) => {
  try {
    const filter = {};

    // --- Xác định shopId ---
    let resolvedShopId = null;

    if (shopId) {
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
        throw new Error("shopId không hợp lệ");
      }
      resolvedShopId = mongoose.Types.ObjectId(shopId);
    } else if (accountId) {
      // Nếu không truyền shopId, dùng accountId để tra ra shop
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        throw new Error("accountId không hợp lệ");
      }

      const shop = await Shop.findOne({ accountId }).select("_id").lean();
      if (!shop) {
        throw new Error("Không tìm thấy shop tương ứng với accountId này");
      }
      resolvedShopId = shop._id;
    }

    if (resolvedShopId) {
      filter.shopId = resolvedShopId;
    }

    // --- Lọc theo trạng thái hoạt động ---
    if (!includeInactive) {
      filter.isActive = true;
    }

    // --- Truy vấn dữ liệu ---
    const products = await Product.find(filter)
      .sort({ createdAt: -1 }) // mới nhất lên trước
      .select("_id pdName basePrice images isActive shopId createdAt updatedAt") // chọn cột cần thiết
      .lean();

    return {
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
      data: products,
    };
  } catch (error) {
    console.error("getAllProducts error:", error);
    return {
      success: false,
      message: error.message || "Lỗi khi lấy danh sách sản phẩm",
      data: [],
    };
  }
};

/**
 * Lấy chi tiết 1 sản phẩm kèm toàn bộ biến thể
 * @param {String} productId
 */
export const getProductDetail = async (productId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new Error("ID sản phẩm không hợp lệ");

    //  Lấy sản phẩm chính 
    const product = await Product.findById(productId)
      .populate("shopId", "shopName", "logoUrl")
      .lean();
    if (!product) throw new Error("Không tìm thấy sản phẩm");

    // Lấy danh sách biến thể 
    const variants = await ProductVariant.find({ productId })
      .populate({
        path: "attributes.attributeId",
        select: "label",
      })
      .populate({
        path: "attributes.valueId",
        select: "value",
      })
      .lean();

    // Map lại để dễ đọc 
    const mappedVariants = variants.map((v) => ({
      _id: v._id,
      variantKey: v.variantKey,
      stock: v.stock,
      image: v.image,
      priceAdjustment: v.priceAdjustment,
      attributes: v.attributes.map((a) => ({
        attributeId: a.attributeId?._id,
        attributeLabel: a.attributeId?.label || null,
        valueId: a.valueId?._id,
        valueLabel: a.valueId?.value || null,
      })),
    }));


    return {
      success: true,
      message: "Lấy chi tiết sản phẩm thành công",
      data: {
        ...product,
        variants: mappedVariants,
      },
    };
  } catch (error) {
    // console.error("Lỗi getProductDetail:", error);
    return {
      success: false,
      message: error.message || "Không thể lấy chi tiết sản phẩm",
    };
  }
};

/**
 * Tạo sản phẩm mới kèm biến thể
 *
 * @param {Object} payload
 *   {
 *     pdName: String,
 *     basePrice: Number,
 *     description?: String,
 *     images?: [String],          // danh sách ảnh sản phẩm
 *     accountId: String|ObjectId, // để xác định shopId
 *     variantsPayload?: Array     // nếu FE đã sinh tổ hợp biến thể
 *   }
 *
 * @returns { success, message, data }  // data = { product, variants }
 */
export const createProductWithVariantsService = async (payload) => {
  let createdProduct = null;
  let createdVariants = [];

  try {
    const { pdName, basePrice, description = "", images = [], accountId, variantsPayload = [] } = payload;

    if (!pdName || typeof pdName !== "string") throw new Error("Thiếu tên sản phẩm hợp lệ");
    if (isNaN(basePrice) || basePrice < 0) throw new Error("Giá sản phẩm không hợp lệ");
    if (!accountId) throw new Error("Thiếu accountId để xác định shop");

    // --- Lấy shopId từ accountId ---
    const shop = await Shop.findOne({ accountId }).select("_id").lean();
    if (!shop) throw new Error("Không tìm thấy shop của tài khoản này");
    const shopId = shop._id;

    // --- Transaction để tạo sản phẩm và các biến thể ---
    await withTransaction(async (session) => {
      // Tạo sản phẩm
      createdProduct = await Product.create([{
        pdName,
        basePrice,
        description,
        images,
        shopId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }], { session });

      createdProduct = createdProduct[0]; // vì insertMany trả về mảng

      // Tạo biến thể nếu có variantsPayload
      if (Array.isArray(variantsPayload) && variantsPayload.length > 0) {
        // gọi service đã viết trước: createProductVariantsBulk
        const variantResult = await createProductVariantsBulk(
          createdProduct._id,
          accountId,
          variantsPayload
        );

        if (!variantResult.success) throw new Error(variantResult.message);
        createdVariants = variantResult.data;
      }
    });

    return {
      success: true,
      message: "Tạo sản phẩm mới thành công",
      data: { product: createdProduct, variants: createdVariants },
    };
  } catch (error) {
    // Nếu có lỗi, xóa ảnh đã upload nếu có (rollback)
    if (images?.length) {
      for (const img of images) {
        try {
          const fullPath = path.isAbsolute(img) ? img : path.join(productUploadDir, img);
          if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn("Không xóa được ảnh rollback:", img, e.message);
        }
      }
    }

    return { success: false, message: error.message, data: {} };
  }
};


/**
 * Cập nhật thông tin cơ bản của sản phẩm
 * @param {String} productId
 * @param {Object} updates { pdName?, basePrice?, description? }
 */
export const updateProductBasicInfoService = async (productId, updates) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new Error("ID sản phẩm không hợp lệ");

    const allowedFields = ["pdName", "basePrice", "description"];
    const updateData = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined && updates[key] !== null) {
        updateData[key] = updates[key];
      }
    }

    if (Object.keys(updateData).length === 0)
      throw new Error("Không có dữ liệu cần cập nhật");

    // Kiểm tra giá nếu có basePrice
    if (updateData.basePrice != null) {
      if (isNaN(updateData.basePrice))
        throw new Error("Giá sản phẩm phải là số hợp lệ");
      if (updateData.basePrice < 0)
        throw new Error("Giá sản phẩm phải lớn hơn hoặc bằng 0");
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true }
    ).lean();

    if (!product) throw new Error("Không tìm thấy sản phẩm");

    return {
      success: true,
      message: "Cập nhật thông tin sản phẩm thành công",
      data: product,
    };
  } catch (error) {
    // console.error("Lỗi updateProductBasicInfoService:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Cập nhật danh sách ảnh của sản phẩm (xóa ảnh cũ khỏi thư mục nếu có)
 * @param {String} productId
 * @param {Array<String>} images Danh sách ảnh mới
 */
export const updateProductImagesService = async (productId, newImages = []) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new Error("ID sản phẩm không hợp lệ");

    if (!Array.isArray(newImages))
      throw new Error("Danh sách ảnh không hợp lệ");

    const product = await Product.findById(productId);
    if (!product) throw new Error("Không tìm thấy sản phẩm");

    const oldImages = product.images || [];

    // --- Xóa ảnh cũ không còn trong danh sách mới ---
    for (const oldImg of oldImages) {
      // Nếu ảnh cũ không nằm trong danh sách mới
      if (!newImages.includes(oldImg)) {
        const oldPath = path.join(productUploadDir, path.basename(oldImg));
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            // console.log("Đã xóa ảnh cũ:", oldPath);
          }
        } catch (err) {
          console.warn(`Không thể xóa ảnh: ${oldPath}`, err.message);
        }
      }
    }

    // --- Cập nhật DB ---
    product.images = newImages;
    await product.save();

    return {
      success: true,
      message: "Cập nhật ảnh sản phẩm thành công",
      data: product.toObject(),
    };
  } catch (error) {
    // console.error("Lỗi updateProductImagesService:", error);
    return { success: false, message: error.message };
  }
};

export const toggleProductActiveAutoService = async (productId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new Error("ID sản phẩm không hợp lệ");

    const product = await Product.findById(productId);
    if (!product) throw new Error("Không tìm thấy sản phẩm");

    product.isActive = !product.isActive;
    await product.save();

    return {
      success: true,
      message: product.isActive
        ? "Sản phẩm đã được hiển thị"
        : "Sản phẩm đã bị ẩn",
      data: product,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Di chuyển file ảnh sang thư mục tạm (trash)
 */
const moveImagesToTrash = (imagePaths = []) => {
  const movedFiles = [];
  for (const imgPath of imagePaths) {
    try {
      const fullPath = path.isAbsolute(imgPath)
        ? imgPath
        : path.join(productUploadDir, imgPath);

      if (fs.existsSync(fullPath)) {
        const destPath = path.join(productTrashDir, path.basename(fullPath));
        fs.renameSync(fullPath, destPath); // di chuyển
        movedFiles.push({ from: fullPath, to: destPath });
      }
    } catch (err) {
      console.warn(`Không thể di chuyển ảnh: ${imgPath} (${err.message})`);
    }
  }
  return movedFiles;
};
/**
 * Khôi phục ảnh từ trash nếu transaction rollback
 */
const restoreImagesFromTrash = (movedFiles = []) => {
  for (const f of movedFiles) {
    try {
      if (fs.existsSync(f.to)) {
        fs.renameSync(f.to, f.from);
      }
    } catch (err) {
      console.warn(`Không thể khôi phục ảnh: ${f.from} (${err.message})`);
    }
  }
};

/**
 * Xóa hẳn ảnh sau khi transaction commit thành công
 */
const permanentlyDeleteTrashImages = (movedFiles = []) => {
  for (const f of movedFiles) {
    try {
      if (fs.existsSync(f.to)) fs.unlinkSync(f.to);
    } catch (err) {
      console.warn(`Không thể xóa ảnh trong trash: ${f.to} (${err.message})`);
    }
  }
};

/**
 * Xóa sản phẩm và các biến thể liên quan, rollback ảnh nếu lỗi
 */
export const deleteProductWithVariantsService = async (productId) => {
  let movedFiles = [];

  try {
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new Error("ID sản phẩm không hợp lệ");

    const result = await withTransaction(async (session) => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error("Không tìm thấy sản phẩm");

      const variants = await ProductVariant.find({ productId }).session(session);

      // Di chuyển ảnh sang thư mục tạm (backup)
      const allImages = [
        ...(product.images || []),
        ...(variants.map((v) => v.image).filter(Boolean) || []),
      ];
      movedFiles = moveImagesToTrash(allImages);

      // Xóa dữ liệu trong DB
      await ProductVariant.deleteMany({ productId }).session(session);
      await Product.findByIdAndDelete(productId).session(session);

      return {
        success: true,
        message: `Đã xóa sản phẩm "${product.pdName}" và các biến thể liên quan.`,
      };
    });

    // Transaction thành công → xóa ảnh trong trash
    setImmediate(() => permanentlyDeleteTrashImages(movedFiles));

    return result;
  } catch (error) {
    // Transaction thất bại → khôi phục ảnh
    restoreImagesFromTrash(movedFiles);
    return { success: false, message: error.message };
  }
};

/**
 * Thống kê số lượng sản phẩm
 * @param {Object} options
 * @param {String|ObjectId} [options.shopId] - ID cửa hàng
 * @param {String|ObjectId} [options.accountId] - ID tài khoản (nếu cần suy ra shop)
 * @param {Boolean} [options.includeInactive=false] - true => lấy cả sản phẩm ẩn
 * @returns {Object} { success, message, total }
 */
export const countProductsService = async ({ shopId, accountId, includeInactive = false }) => {
  try {
    let finalShopId = shopId;

    // Nếu không có shopId mà có accountId → tìm shop theo account
    if (!finalShopId && accountId) {
      const shop = await Shop.findOne({ accountId }).select("_id");
      if (!shop) throw new Error("Không tìm thấy cửa hàng của tài khoản này.");
      finalShopId = shop._id;
    }

    // Xây filter
    const filter = {};
    if (finalShopId) filter.shopId = finalShopId;
    if (!includeInactive) filter.isActive = true;

    // Đếm số lượng sản phẩm
    const total = await Product.countDocuments(filter);

    return {
      success: true,
      message: finalShopId
        ? `Tổng số sản phẩm của cửa hàng: ${total}`
        : `Tổng số sản phẩm toàn hệ thống: ${total}`,
      total,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Lỗi khi thống kê sản phẩm",
      total: 0,
    };
  }
}