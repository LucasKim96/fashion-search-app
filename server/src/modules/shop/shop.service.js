// server/src/modules/shop/shop.service.js
import Shop from "./shop.model.js";
import mongoose from "mongoose";
import ApiError from "../../utils/apiError.js";
import { Account } from "../account/index.js";
import { Role } from "../account/index.js";

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
      throw ApiError.badRequest("Trạng thái không hợp lệ");
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
    throw ApiError.badRequest("ID shop không hợp lệ");

  const shop = await Shop.findById(shopId).populate(
    "accountId",
    "username phoneNumber"
  );
  if (!shop) throw ApiError.notFound("Không tìm thấy shop");
  return shop;
};

/**
 * Tạo shop mới
 */
export const createShop = async (data) => {
  const { shopName, logoUrl, coverUrl, description, accountId } = data;

  // 1️⃣ Validate accountId
  if (!mongoose.Types.ObjectId.isValid(accountId))
    throw ApiError.badRequest("accountId không hợp lệ");

  // 2️⃣ Validate shopName
  if (!shopName || !shopName.trim())
    throw ApiError.badRequest("Tên shop là bắt buộc");

  // 3️⃣ Kiểm tra account tồn tại
  const account = await Account.findById(accountId);
  if (!account) throw ApiError.notFound("Tài khoản không tồn tại");

  // 4️⃣ Kiểm tra account đã có shop chưa
  const existingShop = await Shop.findOne({ accountId });
  if (existingShop) throw ApiError.conflict("Tài khoản này đã có shop");

  // 5️⃣ Chuẩn hóa chuỗi
  const trimmedShopName = shopName.trim();
  const trimmedDescription = description?.trim() || "";
  const trimmedLogoUrl = logoUrl?.trim() || "";
  const trimmedCoverUrl = coverUrl?.trim() || "";

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const shop = await Shop.create(
      [
        {
          shopName: trimmedShopName,
          logoUrl: trimmedLogoUrl,
          coverUrl: trimmedCoverUrl,
          description: trimmedDescription,
          accountId,
        },
      ],
      { session }
    );

    const shopOwnerRole = await Role.findOne({ roleName: "Chủ shop" }).session(
      session
    );
    if (!shopOwnerRole)
      throw ApiError.internal("Không tìm thấy role 'Chủ shop'");

    await Account.updateOne(
      { _id: accountId },
      { $addToSet: { roles: shopOwnerRole._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return shop[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * Cập nhật shop (chỉ chủ shop được phép làm)
 */
export const updateShop = async (shopId, accountId, updateData) => {
  // validate ID
  if (!mongoose.Types.ObjectId.isValid(shopId))
    throw ApiError.badRequest("ID shop không hợp lệ");
  if (!mongoose.Types.ObjectId.isValid(accountId))
    throw ApiError.badRequest("accountId không hợp lệ");

  // kiểm tra accountId có tồn tại trong database không
  const account = await Account.findById(accountId);
  if (!account) {
    throw ApiError.notFound("Tài khoản không tồn tại");
  }

  const shop = await Shop.findById(shopId);
  if (!shop) throw ApiError.notFound("Không tìm thấy shop");

  if (shop.accountId.toString() !== accountId)
    throw ApiError.forbidden("Không có quyền cập nhật shop này");

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
  // 1️⃣ Validate ID
  if (!mongoose.Types.ObjectId.isValid(shopId))
    throw ApiError.badRequest("ID shop không hợp lệ");
  if (!mongoose.Types.ObjectId.isValid(accountId))
    throw ApiError.badRequest("accountId không hợp lệ");

  // 2️⃣ Kiểm tra tài khoản tồn tại + roles
  const account = await Account.findById(accountId).populate("roles");
  if (!account) throw ApiError.notFound("Tài khoản không tồn tại");

  // 3️⃣ Kiểm tra shop
  const shop = await Shop.findById(shopId);
  if (!shop) throw ApiError.notFound("Không tìm thấy shop");

  // 4️⃣ Kiểm tra quyền
  const isSuperAdmin = account.roles.some(
    (r) => r.roleName === "Super Admin" || r.level >= 4
  );

  if (!isSuperAdmin && shop.accountId.toString() !== accountId)
    throw ApiError.forbidden("Không có quyền xóa shop này");

  // 5️⃣ Bắt đầu transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 6️⃣ Xóa shop
    await Shop.findByIdAndDelete(shopId, { session });

    // 7️⃣ Xử lý role "Chủ shop" nếu cần
    const shopOwnerRole = await Role.findOne({ roleName: "Chủ shop" });
    if (shopOwnerRole) {
      // Nếu account không còn shop nào nữa thì gỡ role "Chủ shop"
      const remainingShop = await Shop.findOne({ accountId: shop.accountId });
      if (!remainingShop) {
        await Account.updateOne(
          { _id: shop.accountId },
          { $pull: { roles: shopOwnerRole._id } },
          { session }
        );
      }
    }

    // 8️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 9️⃣ Trả message khác nhau
    const message = isSuperAdmin
      ? "Super Admin đã xóa shop thành công"
      : "Shop của bạn đã được xóa thành công";

    return { message };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Cập nhật trạng thái (admin hoặc chủ shop)
 */
export const updateShopStatus = async (shopId, status) => {
  // validate shopId
  if (!mongoose.Types.ObjectId.isValid(shopId))
    throw ApiError.badRequest("ID shop không hợp lệ");

  const validStatuses = ["active", "closed", "suspended"];
  if (!validStatuses.includes(status))
    throw ApiError.badRequest("Trạng thái không hợp lệ");

  const shop = await Shop.findByIdAndUpdate(shopId, { status }, { new: true });
  if (!shop) throw ApiError.notFound("Không tìm thấy shop");

  return shop;
};
