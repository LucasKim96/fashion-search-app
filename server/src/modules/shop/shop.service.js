// server/src/modules/shop/shop.service.js
import { Shop } from "./index.js";
import { ApiError, withTransaction } from "../../utils/index.js";
import { Account, Role } from "../account/index.js";
import { Product, ProductVariant } from "../product/index.js";
import { removeProductsFromAllCarts } from "../cart/cart.service.js";
import path from "path";
import fs from "fs";
import { console } from "inspector";

const DEFAULT_LOGO = "assets/shop/default-logo.png";
const DEFAULT_COVER = "/assets/shop/default-cover.jpg";
const ASSETS_ROOT = path.join(process.cwd(), "assets");
export const DEFAULT_FOLDER = path.join(ASSETS_ROOT, "shop");

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

export const getShopByAccountId = async (accountId) => {
	const shop = await Shop.findOne({ accountId, isDeleted: false });
	if (!shop) {
		throw ApiError.notFound("Bạn chưa có cửa hàng nào.");
	}
	return shop;
};

/**
 * Tạo shop mới
 */
export const createShop = async (data) => {
	const { shopName, logoUrl, coverUrl, description, accountId } = data;

	// --- Các bước kiểm tra ban đầu giữ nguyên ---
	if (!shopName?.trim()) throw ApiError.badRequest("Tên shop là bắt buộc");

	const account = await Account.findById(accountId);
	if (!account) throw ApiError.notFound("Tài khoản không tồn tại");

	// 1. Tìm kiếm shop, BẤT KỂ trạng thái isDeleted
	const anyExistingShop = await Shop.findOne({ accountId });

	// Chuẩn bị dữ liệu mới
	const trimmedShopName = shopName.trim();
	const trimmedDescription = description?.trim() || "";
	const safeLogoUrl = logoUrl?.trim() || DEFAULT_LOGO;
	const safeCoverUrl = coverUrl?.trim() || DEFAULT_COVER;

	return await withTransaction(async (session) => {
		let finalShop;

		// 2. Nếu tìm thấy shop
		if (anyExistingShop) {
			// 2a. Nếu shop đang hoạt động (chưa bị xóa) -> Báo lỗi như cũ
			if (!anyExistingShop.isDeleted) {
				throw ApiError.conflict("Tài khoản này đã có shop đang hoạt động");
			}

			// 2b. Nếu shop đã bị xóa mềm -> Khôi phục và cập nhật
			console.log(`Restoring shop for accountId: ${accountId}`);
			finalShop = await Shop.findByIdAndUpdate(
				anyExistingShop._id,
				{
					$set: {
						shopName: trimmedShopName,
						logoUrl: safeLogoUrl,
						coverUrl: safeCoverUrl,
						description: trimmedDescription,
						isDeleted: false, // <-- Quan trọng: Khôi phục lại shop
						deletedAt: null, // <-- Xóa dấu vết xóa
					},
				},
				{ new: true, session } // 'new: true' để trả về document đã được cập nhật
			);
		} else {
			// 3. Nếu không tìm thấy shop nào -> Tạo mới hoàn toàn
			console.log(`Creating new shop for accountId: ${accountId}`);
			const createdShops = await Shop.create(
				[
					{
						shopName: trimmedShopName,
						logoUrl: safeLogoUrl,
						coverUrl: safeCoverUrl,
						description: trimmedDescription,
						accountId,
					},
				],
				{ session }
			);
			finalShop = createdShops[0];
		}

		// --- Gán lại role "Chủ shop" (quan trọng khi khôi phục) ---
		const shopOwnerRole = await Role.findOne({ roleName: "Chủ shop" }).session(
			session
		);
		if (!shopOwnerRole) {
			throw ApiError.internal("Không tìm thấy role 'Chủ shop'");
		}

		await Account.updateOne(
			{ _id: accountId },
			{ $addToSet: { roles: shopOwnerRole._id } }, // $addToSet an toàn, không thêm nếu đã có
			{ session }
		);

		return finalShop;
	});
};

/**
 * Cập nhật shop (chỉ chủ shop được phép làm)
 */
export const updateShop = async (shopId, accountId, updateData) => {
	// kiểm tra accountId có tồn tại trong database không
	const account = await Account.findById(accountId).populate("roles");
	const isOwner = shop.accountId?._id?.toString() === accountId.toString();
	const isAdmin = account.roles.some(
		(r) => r.roleName === "Super Admin" || r.level >= 3
	);

	if (!account) {
		throw ApiError.notFound("Tài khoản không tồn tại");
	}

	const shop = await Shop.findOne({
		_id: shopId,
		isDeleted: { $ne: true },
	});
	if (!shop) throw ApiError.notFound("Không tìm thấy shop");

	if (!isAdmin && !isOwner) {
		throw ApiError.forbidden("Không có quyền cập nhật shop này");
	}
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

/**
 * Cập nhật logo hoặc cover — tự xóa file cũ
 */
export const updateShopImage = async (
	shopId,
	accountId,
	newUrl,
	type = "logo"
) => {
	const shop = await Shop.findById(shopId);
	if (!shop) throw ApiError.notFound("Không tìm thấy shop");

	const account = await Account.findById(accountId).populate("roles");
	const isOwner = shop.accountId?._id?.toString() === accountId.toString();
	const isAdmin = account.roles.some(
		(r) => r.roleName === "Super Admin" || r.level >= 3
	);

	if (!isAdmin && !isOwner) {
		throw ApiError.forbidden("Không có quyền cập nhật shop này");
	}

	const oldPath = shop[type + "Url"];

	// Chuẩn hóa path an toàn
	const resolvePath = (urlPath) => {
		const safePath = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
		return path.join(process.cwd(), safePath);
	};

	// Kiểm tra và xóa ảnh cũ (nếu đủ điều kiện)
	if (oldPath && oldPath !== newUrl) {
		const filePath = resolvePath(oldPath);

		// Ảnh mặc định (không xóa)
		const isDefaultImage =
			oldPath === DEFAULT_LOGO || oldPath === DEFAULT_COVER;

		// Ảnh đang được field khác dùng (logo ↔ cover)
		const isUsedByOtherField =
			(type === "logo" && shop.coverUrl === oldPath) ||
			(type === "cover" && shop.logoUrl === oldPath);

		// Ảnh không nằm trong thư mục uploads (bảo vệ)
		const isInsideUploads = filePath.includes(
			path.join(process.cwd(), "uploads")
		);

		if (!isDefaultImage && !isUsedByOtherField && isInsideUploads) {
			try {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
					console.log(`🗑️ Đã xóa ảnh ${type} cũ: ${filePath}`);
				}
			} catch (err) {
				console.error("⚠️ Không thể xóa ảnh cũ:", err);
			}
		}
	}

	// Cập nhật ảnh mới
	shop[type + "Url"] = newUrl;
	await shop.save();

	return shop;
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
	const isOwner = shop.accountId?._id?.toString() === accountId.toString();

	if (!isSuperAdmin && !isOwner)
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
	// Validate status
	const validStatuses = ["active", "closed", "suspended"];
	if (!validStatuses.includes(status)) {
		throw ApiError.badRequest("Trạng thái không hợp lệ");
	}

	// Lấy shop để kiểm tra quyền
	const shop = await Shop.findById(shopId).populate(
		"accountId",
		"username phoneNumber"
	);
	if (!shop || shop.isDeleted) {
		throw ApiError.notFound("Không tìm thấy shop");
	}

	// Lấy thông tin người thay đổi (từ Account)
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

	// Kiểm tra nếu status không thay đổi
	if (shop.status === status) {
		throw ApiError.badRequest(`Shop đã đang ở trạng thái '${status}'`);
	}

	// Cập nhật trong transaction
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
	// Kiểm tra quyền Super Admin
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

	// Kiểm tra shop đã bị xóa mềm chưa
	const shop = await Shop.findOne({ _id: shopId, isDeleted: true });
	if (!shop) {
		throw ApiError.notFound("Shop không tồn tại hoặc chưa bị xóa");
	}

	// Chạy transaction khôi phục
	return await withTransaction(async (session) => {
		// Khôi phục shop
		await Shop.updateOne(
			{ _id: shopId },
			{ $set: { isDeleted: false }, $unset: { deletedAt: "" } },
			{ session }
		);

		// Khôi phục toàn bộ sản phẩm
		const restoredProducts = await Product.updateMany(
			{ shopId, isDeleted: true },
			{ $set: { isDeleted: false }, $unset: { deletedAt: "" } },
			{ session }
		);

		// Khôi phục variants của những sản phẩm này
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

		// Khôi phục quyền "Chủ shop" nếu bị gỡ
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

		// Trả kết quả
		return {
			message: `Shop '${shop.shopName}' và toàn bộ sản phẩm đã được khôi phục thành công`,
			restoredProducts: restoredProducts.modifiedCount,
		};
	});
};
