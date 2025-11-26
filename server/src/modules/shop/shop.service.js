import { Shop } from "./index.js";
import { ApiError, withTransaction } from "../../utils/index.js";
import { Account, Role } from "../account/index.js";
import { Product, ProductVariant } from "../product/index.js";
import { removeProductsFromAllCarts } from "../cart/cart.service.js";
import fs from "fs";
import path from "path";

const DEFAULT_LOGO = "/assets/shop/default-logo.png";
const DEFAULT_COVER = "/assets/shop/default-cover.jpg";

// ================================================================
// === HÀM HELPER: Lấy shop và kiểm tra quyền sở hữu/admin       ===
// ================================================================
/**
 * Lấy một shop và kiểm tra xem người dùng có phải là chủ sở hữu hoặc admin không.
 * @param {string} shopId - ID của shop
 * @param {string} accountId - ID của người thực hiện hành động
 * @returns {Promise<{shop: Shop, account: Account, isOwner: boolean, isAdmin: boolean}>}
 */
const getShopAndCheckOwnership = async (shopId, accountId) => {
	const shop = await Shop.findById(shopId);
	if (!shop) throw ApiError.notFound("Không tìm thấy shop");

	const account = await Account.findById(accountId).populate("roles");
	if (!account) throw ApiError.notFound("Không tìm thấy tài khoản");

	const isOwner = shop.accountId.toString() === accountId.toString();
	const isAdmin = account.roles.some((r) => r.level >= 3); // Giả sử Admin level >= 3

	return { shop, account, isOwner, isAdmin };
};

// ================================================================
// === LOGIC LẤY THÔNG TIN (GETTERS)                           ===
// ================================================================

/** Lấy danh sách shop public (chỉ active) */
export const getShops = async (filters = {}, options = {}) => {
	let { page = 1, limit = 20 } = options;
	const query = { status: "active" };

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

/** Lấy chi tiết shop public (chỉ active) */
export const getShopById = async (shopId) => {
	const shop = await Shop.findOne({ _id: shopId, status: "active" }).populate(
		"accountId",
		"username phoneNumber"
	);
	if (!shop)
		throw ApiError.notFound("Không tìm thấy shop hoặc shop đã đóng cửa.");
	return shop;
};

/** Lấy shop của user để quản lý (bất kể status) */
export const getMyShopForManagement = async (accountId) => {
	const shop = await Shop.findOne({ accountId });
	if (!shop) throw ApiError.notFound("Bạn chưa có cửa hàng.");
	return shop;
};

// ================================================================
// === LOGIC TẠO VÀ CẬP NHẬT                                  ===
// ================================================================

/** Tạo shop mới (hoặc khôi phục shop đã đóng) */
export const createShop = async (data) => {
	const { shopName, logoUrl, coverUrl, description, accountId } = data;
	if (!shopName?.trim()) throw ApiError.badRequest("Tên shop là bắt buộc");

	const account = await Account.findById(accountId);
	if (!account) throw ApiError.notFound("Tài khoản không tồn tại");

	const existingShop = await Shop.findOne({ accountId });

	const shopData = {
		shopName: shopName.trim(),
		logoUrl: logoUrl?.trim() || DEFAULT_LOGO,
		coverUrl: coverUrl?.trim() || DEFAULT_COVER,
		description: description?.trim() || "",
		status: "active", // Luôn active khi tạo/khôi phục
	};

	return await withTransaction(async (session) => {
		let finalShop;
		if (existingShop) {
			// Nếu đã có shop, chỉ cập nhật lại thông tin và set status là 'active'
			console.log(`Updating and reopening shop for accountId: ${accountId}`);
			finalShop = await Shop.findByIdAndUpdate(
				existingShop._id,
				{ $set: shopData },
				{ new: true, session }
			);
		} else {
			// Nếu chưa có, tạo mới hoàn toàn
			console.log(`Creating new shop for accountId: ${accountId}`);
			const createdShops = await Shop.create([{ ...shopData, accountId }], {
				session,
			});
			finalShop = createdShops[0];
		}

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

		return finalShop;
	});
};

/** Cập nhật thông tin cơ bản của shop */
export const updateShop = async (shopId, accountId, updateData) => {
	const { shop, isOwner, isAdmin } = await getShopAndCheckOwnership(
		shopId,
		accountId
	);
	if (!isOwner && !isAdmin)
		throw ApiError.forbidden("Không có quyền cập nhật shop này");

	Object.assign(shop, updateData);
	return await shop.save();
};

/** Cập nhật ảnh của shop */
export const updateShopImage = async (
	shopId,
	accountId,
	newUrl,
	type = "logo"
) => {
	const { shop, isOwner, isAdmin } = await getShopAndCheckOwnership(
		shopId,
		accountId
	);
	if (!isOwner && !isAdmin)
		throw ApiError.forbidden("Không có quyền cập nhật shop này");

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

	shop[`${type}Url`] = newUrl;
	return await shop.save();
};

// ================================================================
// === LOGIC THAY ĐỔI TRẠNG THÁI VÀ XÓA                        ===
// ================================================================

/** Chủ shop tự đóng cửa hàng (soft delete) */
export const closeMyShopByAccount = async (accountId) => {
	const shop = await Shop.findOne({ accountId, status: "active" });
	if (!shop)
		throw ApiError.notFound("Không tìm thấy shop đang hoạt động để đóng.");

	return await withTransaction(async (session) => {
		await Shop.updateOne(
			{ _id: shop._id },
			{ $set: { status: "closed" } },
			{ session }
		);
		await Product.updateMany(
			{ shopId: shop._id },
			{ $set: { isActive: false } },
			{ session }
		);
		return { message: `Cửa hàng '${shop.shopName}' đã được tạm đóng.` };
	});
};

/** Chủ shop mở lại cửa hàng */
export const reopenMyShopByAccount = async (accountId) => {
	const shop = await Shop.findOne({ accountId, status: "closed" });
	if (!shop) throw ApiError.notFound("Không có shop nào đang đóng để mở lại.");

	return await withTransaction(async (session) => {
		await Shop.updateOne(
			{ _id: shop._id },
			{ $set: { status: "active" } },
			{ session }
		);
		await Product.updateMany(
			{ shopId: shop._id },
			{ $set: { isActive: true } },
			{ session }
		);
		return { message: `Cửa hàng '${shop.shopName}' đã được mở lại.` };
	});
};

const deletePhysicalFiles = async (urls) => {
	// Lọc ra các URL hợp lệ, chỉ xử lý các file trong thư mục 'uploads' để đảm bảo an toàn
	const validUrls = urls.filter(
		(url) => typeof url === "string" && url.startsWith("/uploads/")
	);

	if (validUrls.length === 0) return;

	console.log(`Chuẩn bị xóa ${validUrls.length} file vật lý...`);

	for (const url of validUrls) {
		// Chuyển URL tương đối thành đường dẫn tuyệt đối trên hệ thống file
		// Bỏ qua dấu '/' ở đầu
		const filePath = path.join(process.cwd(), url.substring(1));

		try {
			await fs.promises.unlink(filePath);
			console.log(`🗑️ Đã xóa file: ${filePath}`);
		} catch (error) {
			// Bỏ qua lỗi "file not found" (ENOENT) vì có thể file đã bị xóa trước đó
			if (error.code !== "ENOENT") {
				console.error(`⚠️ Không thể xóa file ${filePath}:`, error.message);
			}
		}
	}
	console.log("✅ Hoàn tất việc dọn dẹp file.");
};

/**
 * Xóa vĩnh viễn shop và tất cả dữ liệu liên quan
 */
export const hardDeleteShopByAccount = async (accountId) => {
	// --- BƯỚC 1: LẤY THÔNG TIN SHOP VÀ KIỂM TRA QUYỀN ---
	const shop = await Shop.findOne({ accountId });
	if (!shop) throw ApiError.notFound("Không tìm thấy shop để xóa.");

	// Giả sử chỉ có chủ shop mới được xóa cứng
	if (shop.accountId.toString() !== accountId.toString()) {
		throw ApiError.forbidden("Bạn không có quyền thực hiện hành động này.");
	}

	// --- BƯỚC 2: THU THẬP TẤT CẢ CÁC ĐƯỜNG DẪN FILE CẦN XÓA ---
	// Lấy thông tin chi tiết trước khi xóa khỏi DB
	const shopId = shop._id;
	const productsToDelete = await Product.find({ shopId }).lean();
	const productIds = productsToDelete.map((p) => p._id);
	const variantsToDelete = await ProductVariant.find({
		productId: { $in: productIds },
	}).lean();

	const filesToDelete = [
		shop.logoUrl,
		shop.coverUrl,
		...productsToDelete.flatMap((p) => p.images || []),
		...variantsToDelete.flatMap((v) => (v.image ? [v.image] : [])), // Thêm ảnh variant nếu có
	];

	// --- BƯỚC 3: THỰC HIỆN TRANSACTION XÓA DỮ LIỆU ---
	const transactionResult = await withTransaction(async (session) => {
		// Xóa cứng documents
		if (productIds.length > 0) {
			await ProductVariant.deleteMany(
				{ _id: { $in: variantsToDelete.map((v) => v._id) } },
				{ session }
			);
			await Product.deleteMany({ _id: { $in: productIds } }, { session });
		}
		await Shop.deleteOne({ _id: shopId }, { session });

		// Gỡ vai trò "Chủ shop"
		const shopOwnerRole = await Role.findOne({ roleName: "Chủ shop" }).session(
			session
		);
		if (shopOwnerRole) {
			await Account.updateOne(
				{ _id: accountId },
				{ $pull: { roles: shopOwnerRole._id } },
				{ session }
			);
		}

		return {
			message: `Shop '${shop.shopName}' và toàn bộ dữ liệu đã được xóa vĩnh viễn.`,
		};
	});

	// --- BƯỚC 4: XÓA FILE VẬT LÝ VÀ DỌN DẸP NGẦM ---
	// Chỉ chạy sau khi transaction đã thành công
	deletePhysicalFiles(filesToDelete).catch((err) =>
		console.error("Lỗi nền khi xóa file vật lý:", err)
	);

	// Xóa sản phẩm khỏi giỏ hàng (chạy ngầm)
	if (productIds.length > 0) {
		removeProductsFromAllCarts(productIds).catch((err) =>
			console.warn("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", err.message)
		);
	}

	return transactionResult;
};

/**
 * Xóa các shop không có tài khoản hợp lệ (chỉ Super Admin)
 */
export const deleteShopsWithNullAccount = async (adminAccountId) => {
	// --- 1. KIỂM TRA QUYỀN SUPER ADMIN ---
	const admin = await Account.findById(adminAccountId).populate("roles");
	if (!admin) throw ApiError.notFound("Không tìm thấy tài khoản admin");

	const isSuperAdmin = admin.roles.some(
		(r) => r.roleName === "Super Admin" || r.level >= 4
	);
	if (!isSuperAdmin)
		throw ApiError.forbidden(
			"Chỉ Super Admin mới được phép thực hiện thao tác này"
		);

	// --- 2. TÌM KIẾM SHOP "MỒ CÔI" ---
	const validAccountIds = (await Account.find({}, "_id")).map((acc) => acc._id);

	const orphanShops = await Shop.find({
		$or: [
			{ accountId: { $exists: false } },
			{ accountId: null },
			{ accountId: { $nin: validAccountIds } },
		],
	}).lean(); // Dùng .lean() để tăng hiệu suất vì chỉ đọc dữ liệu

	if (orphanShops.length === 0) {
		return {
			message: "Không tìm thấy shop nào cần dọn dẹp.",
			deletedShops: 0,
			deletedProducts: 0,
		};
	}

	const shopIds = orphanShops.map((s) => s._id);

	// --- 3. THU THẬP TẤT CẢ FILE CẦN XÓA ---
	const productsToDelete = await Product.find({
		shopId: { $in: shopIds },
	}).lean();
	const productIds = productsToDelete.map((p) => p._id);
	const variantsToDelete = await ProductVariant.find({
		productId: { $in: productIds },
	}).lean();

	const filesToDelete = [
		...orphanShops.flatMap((s) => [s.logoUrl, s.coverUrl]),
		...productsToDelete.flatMap((p) => p.images || []),
		...variantsToDelete.flatMap((v) => (v.image ? [v.image] : [])),
	];

	// --- 4. THỰC HIỆN TRANSACTION XÓA DỮ LIỆU ---
	const transactionResult = await withTransaction(async (session) => {
		if (productIds.length > 0) {
			await ProductVariant.deleteMany(
				{ _id: { $in: variantsToDelete.map((v) => v._id) } },
				{ session }
			);
			await Product.deleteMany({ _id: { $in: productIds } }, { session });
		}

		const deleteShopResult = await Shop.deleteMany(
			{ _id: { $in: shopIds } },
			{ session }
		);

		return {
			deletedShops: deleteShopResult.deletedCount,
			deletedProducts: productIds.length,
		};
	});

	// --- 5. DỌN DẸP NGẦM SAU KHI TRANSACTION THÀNH CÔNG ---
	deletePhysicalFiles(filesToDelete).catch((err) =>
		console.error("Lỗi nền khi xóa file của shop mồ côi:", err)
	);

	if (productIds.length > 0) {
		removeProductsFromAllCarts(productIds).catch((err) =>
			console.warn("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", err.message)
		);
	}

	return {
		message: `Đã xóa vĩnh viễn ${transactionResult.deletedShops} shop không hợp lệ và ${transactionResult.deletedProducts} sản phẩm liên quan.`,
		...transactionResult,
	};
};
