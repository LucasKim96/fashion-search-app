import AttributeValue from "./attributeValue.model.js";
import Attribute from "./attribute.model.js";
import mongoose from "mongoose";
import { withTransaction } from "../../utils/index.js";
import Shop from "../shop/shop.model.js";
import fs from "fs";
import path from "path";

const attributeUploadDir = path.resolve("src/uploads/products");

// Chuyển id sang ObjectId, trả về null nếu không hợp lệ
export const toObjectId = (id) => {
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

const validateAttributeValue = (value) => {
  if (!value || typeof value !== "object") throw new Error("Giá trị attribute không hợp lệ");
  if (!value.value || value.value.trim() === "") throw new Error("Giá trị attribute không được để trống");
  return true;
};

const _fetchAttributeWithValues = async (attributeId, session = null) => {
  const attribute = await Attribute.findById(attributeId).session(session).lean();
  if (!attribute) return null;

  const values = await AttributeValue.find({
    attributeId,
    isActive: { $ne: false },
  })
    .session(session)
    .lean();

  return { ...attribute, values };
};

// Tạo nhiều value cho 1 attribute đã có (admin hoặc shop)
// Lưu ý: shop có thể tạo value cho thuộc tính global nhưng chỉ riêng shop đó
export const createAttributeValues = async (attributeId, values = [], accountId = null) => {
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

    await AttributeValue.insertMany(docs, { session });

    // Trả về attribute kèm toàn bộ value (cả global và shop-specific)
    const result = await _fetchAttributeWithValues(attribute._id, session);
    return {
      success: true,
      message: "Tạo value thành công",
      data: result,
    };
  }).catch((error) => {
    return { success: false, message: error.message };
  });
};

// Cập nhật 1 value
export const updateAttributeValue = async (valueId, payload, accountId = null, session) => {
  try {
    const oldValue = await AttributeValue.findById(valueId).session(session);
    if (!oldValue) throw new Error(`Không tìm thấy value với id ${valueId}`);

    const attribute = await Attribute.findById(oldValue.attributeId).session(session);
    if (!attribute) throw new Error("Không tìm thấy attribute của value");

    let isAdmin = false;
    let currentShopId = null;

    if (accountId) {
      const shop = await Shop.findOne({ accountId: toObjectId(accountId), isDeleted: false }).session(session);
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

    // Validate nếu có thay đổi
    const hasValueChange =
      (payload.value && payload.value.trim() !== oldValue.value);

    if (hasValueChange) validateAttributeValue(payload);

    // Xử lý ảnh
    const removeImage = payload.image === "" && oldValue.image;
    const hasNewImage = payload.image && payload.image !== oldValue.image;

    if (hasNewImage && oldValue.image) {
      const oldPath = path.join(attributeUploadDir, path.basename(oldValue.image));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } else if (removeImage) {
      const oldPath = path.join(attributeUploadDir, path.basename(oldValue.image));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const newImage =
      removeImage ? "" :
      hasNewImage ? payload.image :
      oldValue.image ?? "";

    // Cập nhật
    oldValue.value = payload.value !== undefined ? payload.value.trim() : oldValue.value;
    oldValue.image = newImage;
    oldValue.shopId = isAdmin ? null : currentShopId;
    oldValue.isActive = true;

    await oldValue.save({ session });

    return {
      success: true,
      message: "Cập nhật value thành công",
      data: oldValue,
    };
  } catch (error) {
    return { success: false, message: error.message, data: null };
  }
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
export const deleteAttributeValue = async (valueId, accountId = null, session) => {
  try {
    const oldValue = await AttributeValue.findById(valueId).session(session);
    if (!oldValue) throw new Error(`Không tìm thấy value với id ${valueId}`);

    const attribute = await Attribute.findById(oldValue.attributeId).session(session);
    if (!attribute) throw new Error("Không tìm thấy attribute của value");

    if (accountId) {
      const shop = await Shop.findOne({ accountId: toObjectId(accountId), isDeleted: false }).session(session);
      if (!shop) throw new Error("Không tìm thấy cửa hàng cho tài khoản này");
      if (attribute.isGlobal)
        throw new Error("Shop không được phép xóa thuộc tính toàn cục");
      if (attribute.shopId?.toString() !== shop._id.toString())
        throw new Error("Bạn không có quyền xóa thuộc tính của shop khác!");
    } else {
      if (!attribute.isGlobal)
        throw new Error("Admin chỉ được phép xóa thuộc tính toàn cục");
    }

    // Xóa ảnh nếu có
    if (oldValue.image) {
      const imagePath = path.join(attributeUploadDir, path.basename(oldValue.image));
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await AttributeValue.deleteOne({ _id: valueId }, { session });

    return { success: true, message: "Đã xóa value thành công" };
  } catch (error) {
    console.error("deleteAttributeValue error:", error);
    return { success: false, message: error.message };
  }
};
