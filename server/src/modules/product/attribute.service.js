import mongoose from "mongoose";
import Attribute from "./attribute.model.js";
import AttributeValue from "./attributeValue.model.js";
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
  validateAttributeValue, 
  fetchAttributeWithValues 
} from "../../utils/index.js";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
export const DEFAULT_FOLDER = path.join(UPLOADS_ROOT, "attributes");
export const ATTRIBUTES_PUBLIC = "/uploads/attributes";

/**
 * Lấy danh sách Attribute + AttributeValue linh hoạt
 * @param {Object} options
 * @param {String} [options.accountId] - có => là shop
 * @param {Boolean} [options.isAdmin=false] - true => chỉ lấy global
 * @param {Boolean} [options.includeInactive=false] - true => lấy tất cả kể cả isActive=false
 * @param {Number} [options.page=1]
 * @param {Number} [options.limit=20]
 * @param {String} [options.sortBy="createdAt"]
 * @param {String} [options.sortOrder="desc"]
 */
export const getAttributesFlexible = async ({
  accountId,
  isAdmin = false,
  includeInactive = false, 
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  try {
    let shopId = null;

    // --- Xác định shop nếu không phải admin ---
    if (!isAdmin) {
      if (!accountId) throw new Error("Thiếu accountId của shop");
      const shop = await Shop.findOne({ accountId }).select("_id").lean();
      if (!shop) throw new Error("Không tìm thấy shop tương ứng với tài khoản này");
      shopId = shop._id;
    }

    // --- Phân trang & sort ---
    const maxLimit = 100;
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), maxLimit);
    const skip = (safePage - 1) * safeLimit;

    const allowedSortFields = ["createdAt", "updatedAt", "label"];
    const allowedSortOrders = ["asc", "desc"];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const validSortOrder = allowedSortOrders.includes(sortOrder) ? sortOrder : "desc";
    const sort = { [validSortBy]: validSortOrder === "desc" ? -1 : 1 };

    // --- Filter Attribute ---
    let attrFilter = {};
    if (!includeInactive) attrFilter.isActive = { $ne: false }; // Chỉ lấy đang hoạt động
    if (isAdmin) {
      attrFilter.isGlobal = true;
    } else {
      attrFilter = {
        $and: [
          ...(includeInactive ? [] : [{ isActive: { $ne: false } }]),
          { $or: [{ isGlobal: true }, { shopId }] },
        ],
      };
    }

    // --- Query ---
    const [attributes, total] = await Promise.all([
      Attribute.find(attrFilter).sort(sort).skip(skip).limit(safeLimit).lean(),
      Attribute.countDocuments(attrFilter),
    ]);

    const attrIds = attributes.map((a) => a._id);

    // --- Filter AttributeValue ---
    let valueFilter = { attributeId: { $in: attrIds } };
    if (!includeInactive) valueFilter.isActive = { $ne: false };

    if (isAdmin) {
      valueFilter.shopId = null;
    } else if (shopId) {
      valueFilter.$or = [{ shopId: null }, { shopId }];
    }

    const allValues = await AttributeValue.find(valueFilter).lean();

    // --- Gom value theo attributeId ---
    const valuesByAttr = new Map();
    for (const v of allValues) {
      const list = valuesByAttr.get(String(v.attributeId)) || [];
      list.push(v);
      valuesByAttr.set(String(v.attributeId), list);
    }

    // --- Gộp lại kết quả ---
    const result = attributes.map((a) => ({
      ...a,
      values: valuesByAttr.get(String(a._id)) || [],
    }));

    return {
      success: true,
      message: "Lấy danh sách thuộc tính thành công",
      data: {
        attributes: result,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  } catch (error) {
    console.error("getAttributesFlexible error:", error);
    return { success: false, message: error.message };
  }
};

export const getAttributesUnified = async ({
  accountId,        // có => là shop
  isAdmin = false,  // true => chỉ lấy global
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  try {
    let shopId = null;

    // --- Nếu không phải admin thì xác định shop từ accountId ---
    if (!isAdmin) {
      if (!accountId) throw new Error("Thiếu accountId của shop");
      const shop = await Shop.findOne({ accountId }).select("_id").lean();
      if (!shop) throw new Error("Không tìm thấy shop tương ứng với tài khoản này");
      shopId = shop._id;
    }

    // --- Cấu hình phân trang & sort an toàn ---
    const maxLimit = 100;
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), maxLimit);
    const skip = (safePage - 1) * safeLimit;

    const allowedSortFields = ["createdAt", "updatedAt", "label"];
    const allowedSortOrders = ["asc", "desc"];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const validSortOrder = allowedSortOrders.includes(sortOrder) ? sortOrder : "desc";
    const sort = { [validSortBy]: validSortOrder === "desc" ? -1 : 1 };

    // --- Xác định filter ---
    let filter = { isActive: { $ne: false } };
    if (isAdmin) {
      // Admin → chỉ lấy global
      filter.isGlobal = true;
    } else {
      // Shop → lấy global + local
      filter = {
        $and: [
          { isActive: { $ne: false } },
          { $or: [{ isGlobal: true }, { shopId }] },
        ],
      };
    }

    // --- Truy vấn thuộc tính ---
    const [attributes, total] = await Promise.all([
      Attribute.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(),
      Attribute.countDocuments(filter),
    ]);

    const attrIds = attributes.map((a) => a._id);

    // --- Lấy AttributeValue chung + shop-specific ---
    let allValuesFilter = {
      attributeId: { $in: attrIds },
      isActive: { $ne: false },
    };

    if (!isAdmin && shopId) {
      // Shop: lấy global + value của shop mình
      allValuesFilter.$or = [
        { shopId: null },       // giá trị global
        { shopId: shopId },             // giá trị shop riêng
      ];
    } else if (isAdmin) {
      // Admin: chỉ lấy giá trị global
      allValuesFilter.shopId = null;
    }
    const allValues = await AttributeValue.find(allValuesFilter).lean();

    // // Nếu là shop, lấy shop overrides
    // let overrides = [];
    // if (!isAdmin && shopId) {
    //   const valueIds = allValues.map((v) => v._id);
    //   overrides = await ShopAttributeValue.find({
    //     shopId,
    //     attributeValueId: { $in: valueIds },
    //     isActive: { $ne: false },
    //   }).lean();
    // }

    // Gom value theo attributeId
    const valuesByAttr = new Map();
    for (const v of allValues) {
      const arr = valuesByAttr.get(String(v.attributeId)) || [];
      arr.push(v);
      valuesByAttr.set(String(v.attributeId), arr);
    }

    const result = attributes.map((a) => {
      const vals = valuesByAttr.get(String(a._id)) || [];
      return { ...a, values: vals };
    });

    return {
      success: true,
      message: "Lấy danh sách thuộc tính thành công!",
      data: {
        attributes: result,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  } catch (error) {
    console.error("getAttributesUnified error:", error);
    return { success: false, message: error.message };
  }
};



// Lấy chi tiết attribute
export const getAttributeById = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const attribute = await fetchAttributeWithValues(id);
    if (!attribute) throw new Error("Không tìm thấy thuộc tính");
    return { success: true, message: "Lấy thuộc tính thành công", data: attribute };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Tạo attribute + values
export const createAttribute = async (payload, accountId = null, tempFiles = []) => {
  return withTransaction(async (session) => {
    const label = payload.label;
    let values = payload.values || [];

    if (!label || label.trim() === "")
      throw new Error("Thiếu label attribute");

    let isGlobal = false;
    let shopId = null;

    // Nếu có accountId => tạo attribute cho shop
    if (accountId) {
      const shop = await Shop.findOne({
        accountId: toObjectId(accountId),
        isDeleted: false,
      }).session(session);

      if (!shop) throw new Error("Không tìm thấy cửa hàng cho tài khoản này");
      shopId = shop._id;
      isGlobal = false;
    } else {
      // Nếu không có accountId => admin tạo attribute toàn cục
      isGlobal = true;
      shopId = null;
    }

    // Validate values
    if (Array.isArray(values) && values.length)
      values.forEach(validateAttributeValue);

    // Tạo attribute
    const attribute = new Attribute({
      label: label.trim(),
      isGlobal,
      shopId, 
      isActive: true
    });
    await attribute.save({ session });

    // Tạo danh sách value nếu có
    if (Array.isArray(values) && values.length) {
      const docs = values.map((v) => ({
        attributeId: attribute._id,
        value: v.value.trim(),
        image: v.image || "",
        shopId, // luôn gán shopId (null nếu là admin)
        isActive: true,
      }));

      await AttributeValue.insertMany(docs, { session });
    }

    const result = await fetchAttributeWithValues(attribute._id, session);
    return {
      success: true,
      message: "Tạo thuộc tính thành công!",
      data: result,
    };
  }).catch((error) => {
      rollbackFiles(tempFiles);
      return { success: false, message: error.message };
  });
};


// Cập nhật attribute + value (có kiểm tra quyền của shop)
export const updateAttribute = async (id, body, accountId = null, tempFiles = []) => {
  const backups = []; // ← lưu danh sách file backup để khôi phục nếu lỗi

  return withTransaction(async (session) => {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");

    const attribute = await Attribute.findById(id).session(session);
    if (!attribute) throw new Error("Không tìm thấy attribute");

    const { label } = body;
    let values = body.values || [];

    // --- Xác định quyền ---
    let isAdmin = false;
    let currentShopId = null;

    if (accountId) {
      const shop = await Shop.findOne({
        accountId: toObjectId(accountId),
        isDeleted: false,
      }).session(session);
      if (!shop) throw new Error("Không tìm thấy cửa hàng cho tài khoản này");
      currentShopId = shop._id;

      if (attribute.isGlobal)
        throw new Error("Shop không được phép chỉnh sửa thuộc tính toàn cục (global)");

      if (attribute.shopId?.toString() !== currentShopId.toString())
        throw new Error("Bạn không có quyền sửa thuộc tính của shop khác!");
    } else {
      isAdmin = true;
      if (!attribute.isGlobal)
        throw new Error("Admin chỉ được phép chỉnh sửa thuộc tính toàn cục (global)");
    }

    // --- Cập nhật label ---
    if (label !== undefined) {
      if (!label || label.trim() === "") throw new Error("Label không được để trống");
      attribute.label = label.trim();
    }
    await attribute.save({ session });

    // --- Xử lý values ---
    if (Array.isArray(values) && values.length) {
      const ops = [];

      for (const v of values) {
        // Toggle status
        if (v._action === "toggle-status" && v._id) {
          const oldValue = await AttributeValue.findById(v._id).lean();
          if (!oldValue) throw new Error(`Không tìm thấy value với id ${v._id}`);

          ops.push({
            updateOne: {
              filter: { _id: v._id, attributeId: attribute._id },
              update: { $set: { isActive: !oldValue.isActive } },
            },
          });
          continue;
        }

        // Delete cứng
        if (v._action === "delete" && v._id) {
          const oldValue = await AttributeValue.findById(v._id).lean();
          if (oldValue?.image) {
            const imagePath = path.join(DEFAULT_FOLDER, path.basename(oldValue.image));

            if (fs.existsSync(imagePath)) {
              const backupPath = backupFile(imagePath); // → backup trước khi xóa
              backups.push({ backupPath, originalPath: imagePath });

              fs.unlinkSync(imagePath); // xóa thật
            }
          }

          ops.push({
            deleteOne: { filter: { _id: v._id, attributeId: attribute._id } },
          });
          continue;
        }

        // Update
        if (v._id) {
          const oldValue = await AttributeValue.findById(v._id).lean();
          if (!oldValue) throw new Error(`Không tìm thấy value với id ${v._id}`);

          const removeImage = v.image === "" && oldValue.image;
          const hasNewImage = v.image && v.image !== oldValue.image;
          const hasValueChange = v.value && v.value.trim() !== oldValue.value;

          if (hasValueChange) validateAttributeValue(v);

          const oldPath = oldValue.image
            ? path.join(DEFAULT_FOLDER, path.basename(oldValue.image))
            : null;

          // Nếu có ảnh mới hoặc xoá ảnh cũ → backup trước
          if ((hasNewImage || removeImage) && oldPath && fs.existsSync(oldPath)) {
            const backupPath = backupFile(oldPath);
            backups.push({ backupPath, originalPath: oldPath });
            fs.unlinkSync(oldPath);
          }

          const newImage = removeImage
            ? ""
            : hasNewImage
            ? v.image
            : oldValue.image ?? "";

          if (hasNewImage || hasValueChange || removeImage) {
            ops.push({
              updateOne: {
                filter: { _id: v._id },
                update: {
                  $set: {
                    value: v.value !== undefined ? v.value.trim() : oldValue.value,
                    image: newImage,
                    shopId: isAdmin ? null : currentShopId,
                    isActive: true,
                  },
                },
              },
            });
          }
          continue;
        }

        // Insert mới
        validateAttributeValue(v);
        ops.push({
          insertOne: {
            document: {
              attributeId: attribute._id,
              value: v.value.trim(),
              image: v.image || "",
              shopId: isAdmin ? null : currentShopId,
              isActive: true,
            },
          },
        });
      }

      if (ops.length) await AttributeValue.bulkWrite(ops, { session });
    }

    const updated = await fetchAttributeWithValues(id, session);
    backups.forEach((b) => removeBackup(b.backupPath)); // xóa backup sau khi thành công

    return {
      success: true,
      message: "Cập nhật thuộc tính thành công",
      data: updated,
    };
  }).catch((error) => {
    // Nếu transaction fail → rollback các file đã backup
    backups.forEach((b) => restoreFile(b.backupPath, b.originalPath));
    rollbackFiles(tempFiles);
    return { success: false, message: error.message };
  });
};

// Cập nhật chỉ Attribute (không cập nhật value)
export const updateAttributeOnly = async (id, body, accountId = null) => {
  return withTransaction(async (session) => {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");

    const attribute = await Attribute.findById(id).session(session);
    if (!attribute) throw new Error("Không tìm thấy attribute");

    const { label } = body;

    // Xác định loại người dùng
    let isAdmin = false;
    let currentShopId = null;

    if (accountId) {
      // --- Shop ---
      const shop = await Shop.findOne({
        accountId: toObjectId(accountId),
        isDeleted: false,
      }).session(session);

      if (!shop) throw new Error("Không tìm thấy cửa hàng cho tài khoản này");
      currentShopId = shop._id;

      if (attribute.isGlobal)
        throw new Error("Shop không được phép chỉnh sửa thuộc tính toàn cục (global)");

      if (attribute.shopId?.toString() !== currentShopId.toString())
        throw new Error("Bạn không có quyền sửa thuộc tính của shop khác!");
    } else {
      // --- Admin ---
      isAdmin = true;
      if (!attribute.isGlobal)
        throw new Error("Admin chỉ được phép chỉnh sửa thuộc tính toàn cục (global)");
    }

    // --- Cập nhật label nếu khác giá trị cũ ---
    let message = "Không có thay đổi nào được thực hiện";
    if (label !== undefined) {
      const trimmedLabel = label.trim();
      if (!trimmedLabel) throw new Error("Label không được để trống");

      if (trimmedLabel !== attribute.label) {
        attribute.label = trimmedLabel;
        await attribute.save({ session });
        message = "Cập nhật label thành công";
      }
    }

    return {
      success: true,
      message,
      data: attribute,
    };
  }).catch((error) => {
    return { success: false, message: error.message };
  });
};


// Xóa attribute + value
export const deleteAttribute = async (id) => {
  return withTransaction(async (session) => {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");

    const attribute = await Attribute.findById(id).session(session);
    if (!attribute) throw new Error("Không tìm thấy attribute");

    const values = await AttributeValue.find({ attributeId: attribute._id }).session(session);

    // === Giai đoạn backup trước khi xóa ===
    const backupPaths = [];
    try {
      for (const val of values) {
        if (val.image) {
          const imagePath = path.join(DEFAULT_FOLDER, path.basename(val.image));
          if (fs.existsSync(imagePath)) {
            const backupPath = backupFile(imagePath);
            if (backupPath) backupPaths.push({ imagePath, backupPath });
          }
        }
      }
    } catch (err) {
      throw new Error("Không thể backup ảnh trước khi xóa");
    }

    try {
      // === Xóa file ảnh ===
      for (const val of values) {
        if (val.image) {
          const imagePath = path.join(DEFAULT_FOLDER, path.basename(val.image));
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
      }

      // === Xóa dữ liệu DB ===
      await AttributeValue.deleteMany({ attributeId: attribute._id }).session(session);
      await Attribute.findByIdAndDelete(attribute._id).session(session);

      // === Nếu thành công → xóa file backup ===
      backupPaths.forEach(({ backupPath }) => removeBackup(backupPath));

      return { success: true, message: "Đã xóa thuộc tính và ảnh của các giá trị liên quan" };
    } catch (error) {
      // === Nếu lỗi → khôi phục ảnh từ backup ===
      backupPaths.forEach(({ backupPath, imagePath }) => restoreFile(backupPath, imagePath));
      throw error;
    }
  }).catch((error) => ({ success: false, message: error.message }));
};

// Xóa mềm attribute + values 
export const toggleActiveAttribute = async (id) => {
  try {
    const attr = await Attribute.findById(id);
    if (!attr) throw new Error("Không tìm thấy thuộc tính");

    const newStatus = !attr.isActive;
    attr.isActive = newStatus;
    await attr.save();

    await AttributeValue.updateMany({ attributeId: id }, { isActive: newStatus });

    return {
      success: true,
      message: `Đã ${newStatus ? "kích hoạt" : "ẩn"} thuộc tính và toàn bộ giá trị liên quan`,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Tìm kiếm attributes theo tên
export const searchAttributes = async ({ query, isGlobal, accountId, page = 1, limit = 20 }) => {
  try {
    const filter = {};
        // Nếu có accountId → tìm shop tương ứng
    let shopId = null;
    if (accountId) {
      const shop = await Shop.findOne({
        accountId: toObjectId(accountId),
        isDeleted: false,
      }).lean();

      if (!shop) throw new Error("Không tìm thấy cửa hàng cho tài khoản này");
      shopId = shop._id;
    }

    if (typeof isGlobal === "boolean") filter.isGlobal = isGlobal;
    if (shopId) filter.shopId = shopId;
    if (query && query.trim()) {
      filter.label = { $regex: query.trim(), $options: 'i' };
    }

    const maxLimit = 100;
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), maxLimit);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      Attribute.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Attribute.countDocuments(filter),
    ]);

    return {
      success: true,
      message: "Tìm kiếm thuộc tính thành công!",
      data: {
        items,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        query: query?.trim() || '',
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
