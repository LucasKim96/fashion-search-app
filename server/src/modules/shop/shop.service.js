// server/src/modules/shop/shop.service.js
import Shop from "./shop.model.js";
import mongoose from "mongoose";
import ApiError from "../../utils/apiError.js";
import { Account } from "../account/index.js";
import { Role } from "../account/index.js";
import Product from "../product/product.model.js";
import ProductVariant from "../product/productVariant.model.js";
import { removeProductsFromAllCarts } from "../cart/cart.service.js";

/**
 * Lấy danh sách shop với phân trang + filter
 */
export const getShops = async (filters = {}, options = {}) => {
  let { page = 1, limit = 10 } = options;
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
    .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo mới nhất

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

    // Xử lý các lỗi cụ thể trong transaction
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      throw ApiError.conflict(`${field} đã tồn tại trong hệ thống`);
    }

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
      throw ApiError.badRequest(`Dữ liệu không hợp lệ: ${errors}`);
    }

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
    // 6️⃣ Tìm tất cả sản phẩm của shop
    const products = await Product.find({ shopId }, { _id: 1 }, { session });
    const productIds = products.map((p) => p._id);

    // 7️⃣ Xóa tất cả product variants của shop
    if (productIds.length > 0) {
      await ProductVariant.deleteMany(
        { productId: { $in: productIds } },
        { session }
      );
    }

    // 8️⃣ Xóa tất cả sản phẩm của shop
    await Product.deleteMany({ shopId }, { session });

    // 8️⃣.5️⃣ Xóa sản phẩm khỏi tất cả giỏ hàng (ngoài transaction)
    await removeProductsFromAllCarts(productIds);

    // 9️⃣ Xóa shop
    await Shop.findByIdAndDelete(shopId, { session });

    // 🔟 Xử lý role "Chủ shop" nếu cần
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

    // 1️⃣1️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 1️⃣2️⃣ Trả message khác nhau
    const message = isSuperAdmin
      ? `Super Admin đã xóa shop và ${productIds.length} sản phẩm thành công`
      : `Shop của bạn và ${productIds.length} sản phẩm đã được xóa thành công`;

    return {
      message,
      deletedProducts: productIds.length,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Xử lý các lỗi cụ thể trong transaction
    if (error.name === "CastError") {
      throw ApiError.badRequest("ID không hợp lệ");
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
      throw ApiError.badRequest(`Dữ liệu không hợp lệ: ${errors}`);
    }

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

  // Transaction để đảm bảo tính nhất quán khi thay đổi trạng thái
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const shop = await Shop.findByIdAndUpdate(
      shopId,
      { status },
      { new: true, session }
    );
    if (!shop) throw ApiError.notFound("Không tìm thấy shop");

    // Có thể thêm các tác vụ liên quan khi đóng/mở shop tại đây
    // Ví dụ: cập nhật cache, gửi notification, khóa sản phẩm,...

    await session.commitTransaction();
    session.endSession();
    return shop;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
