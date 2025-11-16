import mongoose from "mongoose";
import ProductVariant from "./productVariant.model.js";
import Product from "./product.model.js";
import Attribute from "./attribute.model.js";
import AttributeValue from "./attributeValue.model.js";
import { createProductVariantsBulk } from "./productVariant.service.js";
import Shop from "../shop/shop.model.js";
import fs from "fs";
import path from "path";
import { 
  rollbackFiles, 
  backupFile, 
  restoreFile, 
  removeBackup, 
  withTransaction, 
  toObjectId,
} from "../../utils/index.js";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const PRODUCT_FOLDER = path.join(UPLOADS_ROOT, "products");
export const PRODUCTS_PUBLIC = "/uploads/products";

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
    .populate({
      path: "shopId",
      select: "shopName logoUrl"
    })
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
export const createProductWithVariantsService = async (payload, tempFiles = []) => {
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

    // --- Transaction để tạo sản phẩm và các biến thể ---
    await withTransaction(async (session) => {
      // Tạo sản phẩm
      createdProduct = await Product.create([{
        pdName,
        basePrice,
        description,
        images,
        shopId: shop._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }], { session });

      createdProduct = createdProduct[0]; // vì insertMany trả về mảng

      // Tạo biến thể nếu có variantsPayload
      if (variantsPayload?.length) {
        const result = await createProductVariantsBulk(createdProduct._id, accountId, variantsPayload, tempFiles, session);
        if (!result.success) throw new Error(result.message);
        createdVariants = result.data;
      }
    });

    return { success: true, message: "Tạo sản phẩm thành công", data: { createdProduct, createdVariants } };
  } catch (error) {
    rollbackFiles(tempFiles);
    return { success: false, message: error.message };
  }
};

/**
 * Xử lý tổng hợp ảnh cho mode "add"
 * @param {String} productId - ID sản phẩm
 * @param {Array<String>} keepImages - danh sách ảnh FE muốn giữ (có thể rỗng)
 * @param {Array<String>} uploadedImages - danh sách ảnh upload mới
 * @returns {Promise<Array<String>>} danh sách ảnh mới sau khi add
 */
export const handleAddModeImages = async (productId, keepImages = [], uploadedImages = []) => {
  const product = await Product.findById(productId).lean();
  if (!product) throw new Error("Không tìm thấy sản phẩm");

  const existingImages = product.images || [];

  // nếu FE có keepImages → giữ keepImages, nếu không → giữ toàn bộ ảnh cũ
  const imagesToKeep = keepImages.length > 0 ? keepImages : existingImages;

  // tổng hợp ảnh cuối cùng
  return [...imagesToKeep, ...uploadedImages];
};
/**
 * Cập nhật danh sách ảnh của sản phẩm (xóa ảnh cũ khỏi thư mục nếu có)
 * @param {String} productId
 * @param {Array<String>} images Danh sách ảnh mới
 */
export const updateProductImagesService = async (productId, newImages = []) => {
  const backups = [];
  const tempFilesToDelete = []; // ảnh mới upload nhưng rollback nếu lỗi
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new Error("ID không hợp lệ");
    if (!Array.isArray(newImages)) throw new Error("Danh sách ảnh không hợp lệ");

    const product = await Product.findById(productId);
    if (!product) throw new Error("Không tìm thấy sản phẩm");

    const oldImages = product.images || [];

    // --- Backup và xác định ảnh cũ cần xóa ---
    for (const old of oldImages) {
      if (!newImages.includes(old)) {
        const filePath = path.join(PRODUCT_FOLDER, path.basename(old));
        if (fs.existsSync(filePath)) {
          const backup = backupFile(filePath);
          if (backup) backups.push({ original: filePath, backup });
        }
      }
    }

    // --- Xác định file mới cần rollback nếu lỗi ---
    for (const img of newImages) {
      if (!oldImages.includes(img)) {
        tempFilesToDelete.push(path.join(PRODUCT_FOLDER, path.basename(img)));
      }
    }

    // --- Cập nhật DB ---
    product.images = newImages;
    await product.save();

    // --- Commit thành công → xóa file cũ không dùng ---
    for (const b of backups) {
      if (fs.existsSync(b.original)) fs.unlinkSync(b.original);
      removeBackup(b.backup);
    }

    return { success: true, message: "Cập nhật ảnh thành công", data: product.toObject() };
  } catch (error) {
    // --- Rollback file mới ---
    rollbackFiles(tempFilesToDelete);

    // --- Restore file cũ nếu backup ---
    for (const b of backups) restoreFile(b.backup, b.original);

    return { success: false, message: error.message };
  }
};

// export const updateProductImagesService = async (productId, newImages = []) => {
//   const backups = [];
//   try {
//     if (!mongoose.Types.ObjectId.isValid(productId)) throw new Error("ID không hợp lệ");
//     if (!Array.isArray(newImages)) throw new Error("Danh sách ảnh không hợp lệ");

//     const product = await Product.findById(productId);
//     if (!product) throw new Error("Không tìm thấy sản phẩm");

//     const oldImages = product.images || [];

//     // Backup ảnh cũ không còn dùng
//     for (const old of oldImages) {
//       if (!newImages.includes(old)) {
//         const filePath = path.join(PRODUCT_FOLDER, path.basename(old));
//         const backup = backupFile(filePath);
//         if (backup) backups.push({ original: filePath, backup });
//       }
//     }

//     // Cập nhật DB
//     product.images = newImages;
//     await product.save();

//     // Xóa bản backup (commit thành công)
//     for (const b of backups) removeBackup(b.backup);

//     return { success: true, message: "Cập nhật ảnh thành công", data: product.toObject() };
//   } catch (error) {
//     // Khôi phục nếu lỗi
//     for (const b of backups) restoreFile(b.backup, b.original);
//     return { success: false, message: error.message };
//   }
// };

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

    for (const key of allowedFields) if (updates[key] != null) updateData[key] = updates[key];

    if (!Object.keys(updateData).length) throw new Error("Không có dữ liệu để cập nhật");

    // Kiểm tra giá nếu có basePrice
    if (updateData.basePrice != null) {
      if (isNaN(updateData.basePrice))
        throw new Error("Giá không hợp lệ");
      if (updateData.basePrice < 0)
        throw new Error("Giá phải lớn hơn hoặc bằng 0");
    }

    const product = await Product.findByIdAndUpdate(productId, { $set: updateData }, { new: true }).lean();
    if (!product) throw new Error("Không tìm thấy sản phẩm");

    return { success: true, message: "Cập nhật sản phẩm thành công", data: product };
  } catch (error) {
    // console.error("Lỗi updateProductBasicInfoService:", error);
    return { success: false, message: error.message };
  }
};

export const toggleProductActiveAutoService = async (productId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new Error("ID không hợp lệ");

    const product = await Product.findById(productId);
    if (!product) throw new Error("Không tìm thấy sản phẩm");

    product.isActive = !product.isActive;
    await product.save();

    return {
      success: true,
      message: product.isActive ? "Sản phẩm đã hiển thị" : "Sản phẩm đã bị ẩn",
      data: product,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};


/**
 * Xóa sản phẩm và các biến thể liên quan, rollback ảnh nếu lỗi
 */
export const deleteProductWithVariantsService = async (productId) => {
  const backups = [];
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new Error("ID không hợp lệ");

    await withTransaction(async (session) => {
      const product = await Product.findById(productId).session(session);
      if (!product) throw new Error("Không tìm thấy sản phẩm");

      const variants = await ProductVariant.find({ productId }).session(session);

      const allImages = [
        ...(product.images || []),
        ...variants.map((v) => v.image).filter(Boolean),
      ];

      // Backup ảnh
      for (const img of allImages) {
        const filePath = path.join(PRODUCT_FOLDER, path.basename(img));
        const backup = backupFile(filePath);
        if (backup) backups.push({ original: filePath, backup });

        // Xóa file gốc
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await ProductVariant.deleteMany({ productId }).session(session);
      await Product.findByIdAndDelete(productId).session(session);
    });

    // Xóa backup (commit thành công)
    for (const b of backups) removeBackup(b.backup);
    return { success: true, message: "Đã xóa sản phẩm và biến thể liên quan" };
  } catch (error) {
    // Rollback file nếu lỗi
    for (const b of backups) restoreFile(b.backup, b.original);
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
    return { success: false, message: error.message, total: 0 };
  }
}