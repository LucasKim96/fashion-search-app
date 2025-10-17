// server/src/modules/shop/shop.service.js
import Shop from "./shop.model.js";
import mongoose from "mongoose";

/**
 * Lấy danh sách shop với phân trang + filter
 */
export const getShops = async (filters = {}, options = {}) => {
  let { page = 1, limit = 20 } = options;
  const query = {};

  // ép kiểu an toàn
  page = Math.max(parseInt(page) || 1, 1);
  limit = Math.max(parseInt(limit) || 20, 1);
  const maxLimit = 100;
  if (limit > maxLimit) limit = maxLimit;

  // validate & chuẩn hóa filters
  if (filters.status) {
    const validStatuses = ["active", "closed", "suspended"];
    if (!validStatuses.includes(filters.status)) {
      throw new Error("Trạng thái không hợp lệ");
    }
    query.status = filters.status;
  }

  if (filters.shopName) {
    // tạo regex an toàn, tránh lỗi regex injection
    const safeName = filters.shopName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.shopName = new RegExp(safeName, "i");
  }

  return await Shop.find(query)
    .populate("accountId", "username phoneNumber")
    .skip((page - 1) * limit)
    .limit(limit);
};

/**
 * Lấy chi tiết shop theo ID
 */
export const getShopById = async (shopId) => {
  if (!mongoose.Types.ObjectId.isValid(shopId))
    throw new Error("ID shop không hợp lệ");

  const shop = await Shop.findById(shopId).populate(
    "accountId",
    "username phoneNumber"
  );
  if (!shop) throw new Error("Không tìm thấy shop");
  return shop;
};

/**
 * Tạo shop mới
 */
export const createShop = async (data) => {
  const { shopName, logoUrl, coverUrl, description, accountId } = data;

  // validate accountId là ObjectId
  if (!mongoose.Types.ObjectId.isValid(accountId))
    throw new Error("accountId không hợp lệ");

  // validate bắt buộc shopName
  if (!shopName || !shopName.trim()) throw new Error("Tên shop là bắt buộc");

  // chuẩn hóa chuỗi
  const trimmedShopName = shopName.trim();
  const trimmedDescription = description?.trim() || "";

  try {
    const shop = new Shop({
      shopName: trimmedShopName,
      logoUrl,
      coverUrl,
      description: trimmedDescription,
      accountId,
    });

    return await shop.save();
  } catch (error) {
    // xử lý lỗi duplicate key (E11000)
    if (error.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0];
      throw Object.assign(new Error(`${key} đã tồn tại`), { status: 409 });
    }
    throw error;
  }
};

/**
 * Cập nhật shop (chỉ chủ shop được phép làm)
 */
export const updateShop = async (shopId, accountId, updateData) => {
  // validate ID
  if (!mongoose.Types.ObjectId.isValid(shopId))
    throw new Error("ID shop không hợp lệ");
  if (!mongoose.Types.ObjectId.isValid(accountId))
    throw new Error("accountId không hợp lệ");

  const shop = await Shop.findById(shopId);
  if (!shop) throw new Error("Không tìm thấy shop");

  if (shop.accountId.toString() !== accountId)
    throw new Error("Không có quyền cập nhật shop này");

  // chỉ cho phép update whitelist fields
  const allowedFields = ["shopName", "logoUrl", "coverUrl", "description"];
  const safeUpdates = {};
  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      safeUpdates[key] =
        typeof updateData[key] === "string"
          ? updateData[key].trim()
          : updateData[key];
    }
  }

  Object.assign(shop, safeUpdates);
  return await shop.save();
};

/**
 * Xóa shop (chỉ chủ shop được phép làm)
 */
export const deleteShop = async (shopId, accountId) => {
  // validate ID
  if (!mongoose.Types.ObjectId.isValid(shopId))
    throw new Error("ID shop không hợp lệ");
  if (!mongoose.Types.ObjectId.isValid(accountId))
    throw new Error("accountId không hợp lệ");

  const shop = await Shop.findById(shopId);
  if (!shop) throw new Error("Không tìm thấy shop");

  if (shop.accountId.toString() !== accountId)
    throw new Error("Không có quyền xóa shop này");

  await Shop.findByIdAndDelete(shopId);
  return { message: "Xóa shop thành công" };
};

/**
 * Cập nhật trạng thái (admin hoặc chủ shop)
 */
export const updateShopStatus = async (shopId, status) => {
  // validate shopId
  if (!mongoose.Types.ObjectId.isValid(shopId))
    throw new Error("ID shop không hợp lệ");

  const validStatuses = ["active", "closed", "suspended"];
  if (!validStatuses.includes(status))
    throw new Error("Trạng thái không hợp lệ");

  const shop = await Shop.findByIdAndUpdate(shopId, { status }, { new: true });
  if (!shop) throw new Error("Không tìm thấy shop");

  return shop;
};
