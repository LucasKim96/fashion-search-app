import Shop from "./shop.model.js";
import mongoose from "mongoose";

/**
 * Lấy danh sách tất cả shop (hoặc có thể thêm filter sau này)
 */
export const getShops = async (filters = {}, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.shopName) query.shopName = new RegExp(filters.shopName, "i");

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

  // Kiểm tra account đã có shop chưa (1 account = 1 shop)
  const existingShop = await Shop.findOne({ accountId });
  if (existingShop) throw new Error("Tài khoản này đã có shop");

  const shop = new Shop({
    shopName,
    logoUrl,
    coverUrl,
    description,
    accountId,
  });

  return await shop.save();
};

/**
 * Cập nhật shop (chỉ chủ shop được phép làm)
 */
export const updateShop = async (shopId, accountId, updateData) => {
  const shop = await Shop.findById(shopId);
  if (!shop) throw new Error("Không tìm thấy shop");

  if (shop.accountId.toString() !== accountId)
    throw new Error("Không có quyền cập nhật shop này");

  Object.assign(shop, updateData);
  return await shop.save();
};

/**
 * Xóa shop (chỉ chủ shop được phép làm)
 */
export const deleteShop = async (shopId, accountId) => {
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
  const validStatuses = ["active", "closed", "suspended"];
  if (!validStatuses.includes(status))
    throw new Error("Trạng thái không hợp lệ");

  const shop = await Shop.findByIdAndUpdate(shopId, { status }, { new: true });

  if (!shop) throw new Error("Không tìm thấy shop");
  return shop;
};
