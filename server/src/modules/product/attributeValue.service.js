import AttributeValue from "./attributeValue.model.js";
import Attribute from "./attribute.model.js";
import mongoose from "mongoose";
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

// Đường dẫn public (frontend / database)
export const ATTRIBUTES_PUBLIC = "/uploads/attributes";
// const attributeUploadDir = path.resolve("src/uploads/attributes");


// Tạo nhiều value cho 1 attribute đã có (admin hoặc shop)
// Lưu ý: shop có thể tạo value cho thuộc tính global nhưng chỉ riêng shop đó
export const createAttributeValues = async (
  attributeId,
  values = [],
  accountId = null,
  tempFiles = []
) => {
  if (!toObjectId(attributeId)) throw new Error("attributeId không hợp lệ");

  return withTransaction(async (session) => {
    const attribute = await Attribute.findById(attributeId).session(session);
    if (!attribute) throw new Error("Không tìm thấy attribute");

    let shopId = null;
    let isAdmin = false;

    if (accountId) {
      // Shop
      const shop = await Shop.findOne({ accountId: toObjectId(accountId), isDeleted: false }).session(session);
      if (!shop) throw new Error("Không tìm thấy cửa hàng cho tài khoản này");
      shopId = shop._id;

      // Shop chỉ bị hạn chế khi thêm value cho attribute của shop khác
      if (attribute.shopId && attribute.shopId.toString() !== shopId.toString()) {
        throw new Error("Bạn không có quyền thêm value cho thuộc tính của shop khác");
      }
      // Nếu attribute là global (shopId = null), shop có thể thêm value với shopId = shop._id
    } else {
      // Admin
      isAdmin = true;
      shopId = null;

      if (!attribute.isGlobal) {
        throw new Error("Admin chỉ được thêm value cho thuộc tính global");
      }
    }

    if (!Array.isArray(values) || values.length === 0) throw new Error("Danh sách values trống");

    // Validate từng value
    values.forEach(validateAttributeValue);

    // Chuẩn bị docs
    const docs = values.map((v) => ({
      attributeId: attribute._id,
      value: v.value.trim(),
      image: v.image || "",
      shopId: isAdmin ? null : shopId, // Nếu shop tạo global value thì gán shopId
      isActive: true,
    }));

    // Lưu vào DB trong transaction
    await AttributeValue.insertMany(docs, { session });

    // Trả về attribute kèm toàn bộ value (cả global và shop-specific)
    const result = await fetchAttributeWithValues(attribute._id, session);

    return {
      success: true,
      message: "Tạo value thành công",
      data: result,
    };
  }).catch((error) => {
    // console.error("Rollback files do lỗi:", error.message);
    rollbackFiles(tempFiles);
    return { success: false, message: error.message };
  });
};

// Cập nhật 1 value
export const updateAttributeValue = async (valueId, payload, accountId = null, file = null) => {
  const savedFiles = []; // Ảnh mới để rollback
  let backupPath = null; // Đường dẫn file .bak nếu có backup
  let oldPath = null;    // Đường dẫn file cũ (để xóa hoặc khôi phục)

  return withTransaction(async (session) => {
    try {
      const oldValue = await AttributeValue.findById(valueId).session(session);
      if (!oldValue) throw new Error(`Không tìm thấy value với id ${valueId}`);

      const attribute = await Attribute.findById(oldValue.attributeId).session(session);
      if (!attribute) throw new Error("Không tìm thấy attribute của value");

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
          throw new Error("Shop không được phép chỉnh sửa thuộc tính toàn cục");
        if (attribute.shopId?.toString() !== currentShopId.toString())
          throw new Error("Bạn không có quyền sửa thuộc tính của shop khác!");
      } else {
        isAdmin = true;
        if (!attribute.isGlobal)
          throw new Error("Admin chỉ được phép chỉnh sửa thuộc tính toàn cục");
      }

      // --- Validate giá trị mới ---
      const hasValueChange = payload.value && payload.value.trim() !== oldValue.value;
      if (hasValueChange) validateAttributeValue(payload);

      // --- Backup ảnh cũ ---
      if (oldValue.image) {
        oldPath = path.join(DEFAULT_FOLDER, path.basename(oldValue.image));
        if (fs.existsSync(oldPath)) {
          backupPath = backupFile(oldPath);
        }
      }

      // --- Nếu có upload ảnh mới ---
      if (file) {
        const imagePath = `${ATTRIBUTES_PUBLIC}/${file.filename}`;
        payload.image = imagePath;
        savedFiles.push(path.join(DEFAULT_FOLDER, file.filename));
      }

      // --- Nếu FE muốn xóa ảnh ---
      const removeImage = payload.image === "" && oldValue.image;

      // --- Gán lại ảnh ---
      const newImage = removeImage
        ? ""
        : payload.image
        ? payload.image
        : oldValue.image ?? "";

      oldValue.value = payload.value ?? oldValue.value;
      oldValue.image = newImage;
      oldValue.shopId = isAdmin ? null : currentShopId;
      oldValue.isActive = true;

      await oldValue.save({ session });

      await session.commitTransaction();

      // === Sau khi thành công ===
      // Xóa file ảnh cũ (nếu có thay đổi)
      if ((file || removeImage) && oldPath && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }

      // Xóa file backup vì không cần nữa
      if (backupPath) removeBackup(backupPath);

      return {
        success: true,
        message: "Cập nhật value thành công",
        data: oldValue,
      };
    } catch (error) {
      // === Rollback khi lỗi ===
      rollbackFiles(savedFiles); // Xóa ảnh mới upload
      if (backupPath && oldPath) restoreFile(backupPath, oldPath); // Khôi phục ảnh cũ
      return { success: false, message: error.message, data: null };
    }
  });
};

// Chuyển trạng thái 1 value 
export const toggleAttributeValueStatus = async (valueId, accountId = null, session) => {
  try {
    const oldValue = await AttributeValue.findById(valueId).session(session);
    if (!oldValue) throw new Error(`Không tìm thấy value với id ${valueId}`);

    const attribute = await Attribute.findById(oldValue.attributeId).session(session);
    if (!attribute) throw new Error("Không tìm thấy attribute của value");

    if (accountId) {
      const shop = await Shop.findOne({ accountId: toObjectId(accountId), isDeleted: false }).session(session);
      if (!shop) throw new Error("Không tìm thấy cửa hàng cho tài khoản này");
      if (attribute.isGlobal)
        throw new Error("Shop không được phép chỉnh sửa thuộc tính toàn cục");
      if (attribute.shopId?.toString() !== shop._id.toString())
        throw new Error("Bạn không có quyền chỉnh sửa thuộc tính của shop khác!");
    } else {
      if (!attribute.isGlobal)
        throw new Error("Admin chỉ được phép chỉnh sửa thuộc tính toàn cục");
    }

    oldValue.isActive = !oldValue.isActive;
    await oldValue.save({ session });
    
    return {
      success: true,
      message: `Đã ${oldValue.isActive ? "kích hoạt" : "vô hiệu hóa"} value thành công`,
      data: oldValue,
    };
  } catch (error) {
    return { success: false, message: error.message, data: null };
  }
};

// Xóa 1 value (bao gồm ảnh)
export const deleteAttributeValue = async (valueId, accountId = null) => {
  let backupInfo = null;

  return withTransaction(async (session) => {
    try {
      const oldValue = await AttributeValue.findById(valueId).session(session);
      if (!oldValue) throw new Error(`Không tìm thấy value với id ${valueId}`);

      const attribute = await Attribute.findById(oldValue.attributeId).session(session);
      if (!attribute) throw new Error("Không tìm thấy attribute của value");

      // Kiểm tra quyền
      if (accountId) {
        const shop = await Shop.findOne({
          accountId: toObjectId(accountId),
          isDeleted: false,
        }).session(session);

        if (!shop) throw new Error("Không tìm thấy cửa hàng cho tài khoản này");
        if (attribute.isGlobal)
          throw new Error("Shop không được phép xóa thuộc tính toàn cục");
        if (attribute.shopId?.toString() !== shop._id.toString())
          throw new Error("Bạn không có quyền xóa thuộc tính của shop khác!");
      } else {
        if (!attribute.isGlobal)
          throw new Error("Admin chỉ được phép xóa thuộc tính toàn cục");
      }

      // Backup ảnh nếu có
      if (oldValue.image) {
        const imgPath = path.join(DEFAULT_FOLDER, path.basename(oldValue.image));
        if (fs.existsSync(imgPath)) {
          const backupPath = backupFile(imgPath);
          backupInfo = { oldPath: imgPath, backupPath };
        }
      }

      // Xóa document
      await AttributeValue.deleteOne({ _id: valueId }).session(session);

      await session.commitTransaction();

      // Nếu thành công → xóa ảnh vật lý thật
      if (backupInfo?.oldPath && fs.existsSync(backupInfo.oldPath)) {
        fs.unlinkSync(backupInfo.oldPath);
      }

      // Xóa bản backup
      if (backupInfo) removeBackup(backupInfo.backupPath);

      return { success: true, message: "Đã xóa value thành công" };
    } catch (error) {
      // Rollback: khôi phục file backup nếu có
      if (backupInfo) restoreFile(backupInfo.backupPath, backupInfo.oldPath);
      return { success: false, message: error.message };
    }
  });
};