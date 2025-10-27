// server/src/modules/shop/shop.service.js
import { Shop } from "./index.js";
import { ApiError, withTransaction } from "../../utils/index.js";
import { Account, Role } from "../account/index.js";
import { Product, ProductVariant } from "../product/index.js";
import { removeProductsFromAllCarts } from "../cart/cart.service.js";
import path from "path";
import fs from "fs";

/**
 * Lấy danh sách shop với phân trang + filter
 */
export const getShops = async (filters = {}, options = {}) => {
  let { page = 1, limit = 20 } = options;
  const query = { isDeleted: { $ne: true } };

  // ép kiểu an toàn
  page = Number(page) > 0 ? Number(page) : 1;
  limit = Math.min(Math.max(Number(limit) || 20, 1), 100);

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

  // Đếm tổng số documents
  const total = await Shop.countDocuments(query);

  // Tính toán pagination
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Lấy data với pagination
  const shops = await Shop.find(query)
    .populate("accountId", "username phoneNumber")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1, _id: -1 });

  return {
    data: shops,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
  };
};

/**
 * Lấy chi tiết shop theo ID
 */
export const getShopById = async (shopId) => {
  const shop = await Shop.findOne({
    _id: shopId,
    isDeleted: { $ne: true },
  }).populate("accountId", "username phoneNumber");

  if (!shop) throw ApiError.notFound("Không tìm thấy shop");
  return shop;
};

/**
 * Tạo shop mới
 */
export const createShop = async (data) => {
  const { shopName, logoUrl, coverUrl, description, accountId } = data;

  if (!shopName?.trim()) throw ApiError.badRequest("Tên shop là bắt buộc");

  const account = await Account.findById(accountId);
  if (!account) throw ApiError.notFound("Tài khoản không tồn tại");

  const existingShop = await Shop.findOne({ accountId });
  if (existingShop) throw ApiError.conflict("Tài khoản này đã có shop");

  const trimmedShopName = shopName.trim();
  const trimmedDescription = description?.trim() || "";
  const trimmedLogoUrl = logoUrl?.trim() || "";
  const trimmedCoverUrl = coverUrl?.trim() || "";

  return await withTransaction(async (session) => {
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

    return shop[0];
  });
};

/**
 * Cập nhật shop (chỉ chủ shop được phép làm)
 */
export const updateShop = async (shopId, accountId, updateData) => {
  // kiểm tra accountId có tồn tại trong database không
  const account = await Account.findById(accountId);
  if (!account) {
    throw ApiError.notFound("Tài khoản không tồn tại");
  }

  const shop = await Shop.findOne({
    _id: shopId,
    isDeleted: { $ne: true },
  });
  if (!shop) throw ApiError.notFound("Không tìm thấy shop");

  if (shop.accountId.toString() !== accountId)
    throw ApiError.forbidden("Không có quyền cập nhật shop này");

  // chỉ cho phép update whitelist fields
  const allowedFields = ["shopName", "description"];
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

  try {
    return await shop.save();
  } catch (error) {
    // Xử lý lỗi validation từ mongoose
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      throw ApiError.badRequest(`Dữ liệu không hợp lệ: ${errors}`);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      throw ApiError.conflict(`${field} đã tồn tại trong hệ thống`);
    }

    throw error;
  }
};

export const updateLogo = async (shopId, accountId, logo) => {
  const shop = await Shop.findOne({
    _id: shopId,
    isDeleted: { $ne: true },
  });
  if (!shop) throw ApiError.notFound("Không tìm thấy shop");

  if (shop.accountId.toString() !== accountId)
    throw ApiError.forbidden("Không có quyền cập nhật avatar shop này");

  if (shop.logoUrl) {
    const oldPath = path.resolve(shop.logoUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  shop.logoUrl = logo.replace(/\\/g, "/");
  return await shop.save();
};

export const updateCoverImage = async (shopId, accountId, cover) => {
  const shop = await Shop.findOne({
    _id: shopId,
    isDeleted: { $ne: true },
  });
  if (!shop) throw ApiError.notFound("Không tìm thấy shop");

  if (shop.accountId.toString() !== accountId)
    throw ApiError.forbidden("Không có quyền cập nhật cover image shop này");

  if (shop.coverUrl) {
    const oldPath = path.resolve(shop.coverUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  shop.coverUrl = cover.replace(/\\/g, "/");
  return await shop.save();
};

/**
 * Xóa shop (chỉ chủ shop được phép làm)
 */
export const deleteShop = async (shopId, accountId) => {
  const account = await Account.findById(accountId).populate("roles");
  if (!account) throw ApiError.notFound("Tài khoản không tồn tại");

  const shop = await Shop.findOne({
    _id: shopId,
    isDeleted: { $ne: true },
  });
  if (!shop) throw ApiError.notFound("Không tìm thấy shop");

  const isSuperAdmin = account.roles.some(
    (r) => r.roleName === "Super Admin" || r.level >= 4
  );

  if (!isSuperAdmin && shop.accountId.toString() !== accountId)
    throw ApiError.forbidden("Không có quyền xóa shop này");

  return await withTransaction(async (session) => {
    const products = await Product.find({ shopId }, { _id: 1 }, { session });
    const productIds = products.map((p) => p._id);

    // Soft delete variants
    if (productIds.length > 0) {
      await ProductVariant.updateMany(
        { productId: { $in: productIds } },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { session }
      );
    }

    // Soft delete products
    await Product.updateMany(
      { shopId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { session }
    );

    // Xóa khỏi cart (ngoài transaction)
    removeProductsFromAllCarts(productIds).catch((err) =>
      console.warn("⚠️ Lỗi khi xóa sản phẩm khỏi giỏ hàng:", err.message)
    );

    // Soft delete shop
    await Shop.updateOne(
      { _id: shopId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { session }
    );

    // Nếu user không còn shop nào khác => gỡ role Chủ shop
    const shopOwnerRole = await Role.findOne({ roleName: "Chủ shop" }).session(
      session
    );
    const stillHasShop = await Shop.exists({
      accountId: shop.accountId,
      isDeleted: false,
    }).session(session);

    if (!stillHasShop && shopOwnerRole) {
      await Account.updateOne(
        { _id: shop.accountId },
        { $pull: { roles: shopOwnerRole._id } },
        { session }
      );
    }

    return {
      message: isSuperAdmin
        ? `Super Admin đã vô hiệu hóa shop và ${productIds.length} sản phẩm`
        : `Shop của bạn đã bị vô hiệu hóa cùng ${productIds.length} sản phẩm`,
      affectedProducts: productIds.length,
    };
  });
};

/**
 * Cập nhật trạng thái (admin hoặc chủ shop)
 */
export const updateShopStatus = async (shopId, accountId, status) => {
  // console.log("accountId:", accountId);
  // 2️⃣ Validate status
  const validStatuses = ["active", "closed", "suspended"];
  if (!validStatuses.includes(status)) {
    throw ApiError.badRequest("Trạng thái không hợp lệ");
  }

  // 4️⃣ Lấy shop để kiểm tra quyền
  const shop = await Shop.findById(shopId).populate(
    "accountId",
    "username phoneNumber"
  );
  if (!shop || shop.isDeleted) {
    throw ApiError.notFound("Không tìm thấy shop");
  }

  // 3️⃣ Lấy thông tin người thay đổi (từ Account)
  const account = await Account.findById(accountId).populate("roles");
  if (!account) {
    throw ApiError.notFound("Không tìm thấy tài khoản");
  }
  const isOwner = shop.accountId?._id?.toString() === accountId.toString();
  const isAdmin = account.roles.some(
    (r) => r.roleName === "Super Admin" || r.level >= 3
  );

  if (!isAdmin && !isOwner) {
    throw ApiError.forbidden("Không có quyền cập nhật trạng thái shop này");
  }

  // ⚠️ Kiểm tra nếu status không thay đổi
  if (shop.status === status) {
    throw ApiError.badRequest(`Shop đã đang ở trạng thái '${status}'`);
  }

  // 5️⃣ Cập nhật trong transaction
  return await withTransaction(async (session) => {
    const updatedShop = await Shop.findOneAndUpdate(
      { _id: shopId, isDeleted: { $ne: true } },
      { status },
      { new: true, session }
    ).populate("accountId", "username phoneNumber");

    if (!updatedShop) {
      throw ApiError.notFound("Không tìm thấy shop");
    }

    return updatedShop;
  });
};

/**
 * Xóa các shop có accountId null (chỉ Super Admin)
 */
export const deleteShopsWithNullAccount = async (adminAccountId) => {
  const admin = await Account.findById(adminAccountId).populate("roles");
  if (!admin) throw ApiError.notFound("Không tìm thấy tài khoản admin");

  const isSuperAdmin = admin.roles.some(
    (r) => r.roleName === "Super Admin" || r.level >= 4
  );
  if (!isSuperAdmin)
    throw ApiError.forbidden(
      "Chỉ Super Admin mới được phép thực hiện thao tác này"
    );

  const validAccountIds = (await Account.find({}, "_id")).map((acc) => acc._id);

  const orphanShops = await Shop.find({
    $or: [
      { accountId: { $exists: false } },
      { accountId: null },
      { accountId: { $nin: validAccountIds } },
    ],
  });
  if (orphanShops.length === 0) return { deletedShops: 0, deletedProducts: 0 };

  const shopIds = orphanShops.map((s) => s._id);

  return await withTransaction(async (session) => {
    const products = await Product.find(
      { shopId: { $in: shopIds } },
      { _id: 1 },
      { session }
    );
    const productIds = products.map((p) => p._id);

    if (productIds.length > 0) {
      await ProductVariant.deleteMany(
        { productId: { $in: productIds } },
        { session }
      );
    }

    await Product.deleteMany({ shopId: { $in: shopIds } }, { session });

    try {
      await removeProductsFromAllCarts(productIds);
    } catch (err) {
      console.warn("⚠️ Lỗi khi xóa sản phẩm khỏi giỏ hàng:", err.message);
    }

    const result = await Shop.deleteMany(
      { _id: { $in: shopIds } },
      { session }
    );

    return {
      deletedShops: result.deletedCount,
      deletedProducts: productIds.length,
    };
  });
};

export const restoreShop = async (shopId, adminAccountId) => {
  // 1️⃣ Kiểm tra quyền Super Admin
  const admin = await Account.findById(adminAccountId).populate(
    "roles",
    "roleName level"
  );
  if (!admin) throw ApiError.notFound("Không tìm thấy tài khoản admin");

  const isSuperAdmin = admin.roles.some(
    (r) => r.roleName === "Super Admin" || r.level >= 4
  );
  if (!isSuperAdmin) {
    throw ApiError.forbidden("Chỉ Super Admin mới được phép khôi phục shop");
  }

  // 2️⃣ Kiểm tra shop đã bị xóa mềm chưa
  const shop = await Shop.findOne({ _id: shopId, isDeleted: true });
  if (!shop) {
    throw ApiError.notFound("Shop không tồn tại hoặc chưa bị xóa");
  }

  // 3️⃣ Chạy transaction khôi phục
  return await withTransaction(async (session) => {
    // 3.1️⃣ Khôi phục shop
    await Shop.updateOne(
      { _id: shopId },
      { $set: { isDeleted: false }, $unset: { deletedAt: "" } },
      { session }
    );

    // 3.2️⃣ Khôi phục toàn bộ sản phẩm
    const restoredProducts = await Product.updateMany(
      { shopId, isDeleted: true },
      { $set: { isDeleted: false }, $unset: { deletedAt: "" } },
      { session }
    );

    // 3.3️⃣ Khôi phục variants của những sản phẩm này
    if (restoredProducts.modifiedCount > 0) {
      const productIds = (
        await Product.find({ shopId }, "_id", { session })
      ).map((p) => p._id);

      await ProductVariant.updateMany(
        { productId: { $in: productIds }, isDeleted: true },
        { $set: { isDeleted: false }, $unset: { deletedAt: "" } },
        { session }
      );
    }

    // 3.4️⃣ Khôi phục quyền "Chủ shop" nếu bị gỡ
    const shopOwnerRole = await Role.findOne({ roleName: "Chủ shop" }).session(
      session
    );
    if (shopOwnerRole) {
      await Account.updateOne(
        { _id: shop.accountId },
        { $addToSet: { roles: shopOwnerRole._id } },
        { session }
      );
    }

    // 3.5️⃣ Trả kết quả
    return {
      message: `Shop '${shop.shopName}' và toàn bộ sản phẩm đã được khôi phục thành công`,
      restoredProducts: restoredProducts.modifiedCount,
    };
  });
};
