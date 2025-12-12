// server/src/modules/shop/shop.controller.js
import * as ShopService from "./shop.service.js";
import * as AuthService from "../auth/auth.service.js";
import { Shop } from "./index.js";
import { apiResponse, ApiError, validateObjectId } from "../../utils/index.js";
import path from "path";
import fs from "fs";

const { successResponse, errorResponse } = apiResponse;
const DEFAULT_LOGO = "assets/shop/default-logo.png";
const DEFAULT_COVER = "assets/shop/default-cover.jpg";

/**
 * Lấy danh sách tất cả shop
 */
export const getShops = async (req, res, next) => {
	try {
		const { page, limit, status, shopName } = req.query;
	try {
		const { page, limit, status, shopName } = req.query;

		// Parse filters
		const filters = {};
		if (status) filters.status = status;
		if (shopName) filters.shopName = shopName;
		// Parse filters
		const filters = {};
		if (status) filters.status = status;
		if (shopName) filters.shopName = shopName;

		// Parse options
		const options = {};
		if (page) options.page = page;
		if (limit) options.limit = limit;
		// Parse options
		const options = {};
		if (page) options.page = page;
		if (limit) options.limit = limit;

		const result = await ShopService.getShops(filters, options);
		return successResponse(res, result, "Lấy danh sách shop thành công");
	} catch (error) {
		// ApiError sẽ được xử lý bởi errorHandler middleware
		next(error);
	}
		const result = await ShopService.getShops(filters, options);
		return successResponse(res, result, "Lấy danh sách shop thành công");
	} catch (error) {
		// ApiError sẽ được xử lý bởi errorHandler middleware
		next(error);
	}
};

/**
 * Lấy thông tin chi tiết shop theo ID
 */
export const getShop = async (req, res, next) => {
	try {
		const { id } = req.params;
	try {
		const { id } = req.params;

		validateObjectId(id, "ID shop");
		validateObjectId(id, "ID shop");

		const shop = await ShopService.getShopById(id);
		return successResponse(res, shop, "Lấy thông tin shop thành công");
	} catch (error) {
		// ApiError sẽ được xử lý bởi errorHandler middleware
		next(error);
	}
		const shop = await ShopService.getShopById(id);
		return successResponse(res, shop, "Lấy thông tin shop thành công");
	} catch (error) {
		// ApiError sẽ được xử lý bởi errorHandler middleware
		next(error);
	}
};

export const getMyShopDetails = async (req, res, next) => {
	try {
		const accountId = req.user?.id; // Lấy ID từ middleware xác thực
		// Gọi đến service layer thay vì query trực tiếp
		const shop = await ShopService.getShopByAccountId(accountId);

		// Sử dụng successResponse để có cấu trúc đồng nhất
		return successResponse(res, shop, "Lấy thông tin shop thành công");
	} catch (error) {
		// Lỗi (bao gồm cả lỗi NOT_FOUND từ service) sẽ được chuyển đến errorHandler
		next(error);
	}
};

export const getMyShopDetails = async (req, res, next) => {
	try {
		const accountId = req.user?.id; // Lấy ID từ middleware xác thực
		// Gọi đến service layer thay vì query trực tiếp
		const shop = await ShopService.getShopByAccountId(accountId);

		// Sử dụng successResponse để có cấu trúc đồng nhất
		return successResponse(res, shop, "Lấy thông tin shop thành công");
	} catch (error) {
		// Lỗi (bao gồm cả lỗi NOT_FOUND từ service) sẽ được chuyển đến errorHandler
		next(error);
	}
};

/**
 * Tạo shop mới
 */
// export const createShop = async (req, res, next) => {
// 	try {
// 		const { shopName, description } = req.body;
// 		const accountId = req.user?.id;

// 		// 3. Xử lý đường dẫn file (Phần quan trọng nhất)
// 		let logoUrl = null; // Khởi tạo là null
// 		let coverUrl = null;

// 		// Chỉ tạo URL nếu file thực sự tồn tại trong request
// 		if (req.files?.logo?.[0]) {
// 			logoUrl = path
// 				.join("/uploads/shops", req.files.logo[0].filename)
// 				.replace(/\\/g, "/");
// 		}

// 		if (req.files?.cover?.[0]) {
// 			coverUrl = path
// 				.join("/uploads/shops", req.files.cover[0].filename)
// 				.replace(/\\/g, "/");
// 		}

// 		// 4. DEBUG: KIỂM TRA URL ĐƯỢC TẠO RA
// 		// Xem các URL này có đúng định dạng bạn mong muốn không.
// 		console.log("Generated Logo URL:", logoUrl);
// 		console.log("Generated Cover URL:", coverUrl);

// 		// 5. Gói dữ liệu để gửi vào service
// 		const shopData = {
// 			shopName,
// 			description,
// 			accountId,
// 			logoUrl, // Truyền URL đã được xử lý (hoặc null)
// 			coverUrl, // Truyền URL đã được xử lý (hoặc null)
// 		};

// 		const result = await ShopService.createShop(shopData);

// 		return successResponse(res, result, "Tạo shop thành công");
// 	} catch (error) {
// 		next(error);
// 	}
// };

export const createShop = async (req, res, next) => {
	try {
		const { shopName, description } = req.body;
		const accountId = req.user?.id;

		let logoUrl = null;
		let coverUrl = null;

		if (req.files?.logo?.[0]) {
			logoUrl = path
				.join("/uploads/shops", req.files.logo[0].filename)
				.replace(/\\/g, "/");
		}
		if (req.files?.cover?.[0]) {
			coverUrl = path
				.join("/uploads/shops", req.files.cover[0].filename)
				.replace(/\\/g, "/");
		}

		const shopData = {
			shopName,
			description,
			accountId,
			logoUrl,
			coverUrl,
		};

		// Nhận về object chứa shop và account đã được cập nhật từ ShopService
		const { shop, updatedAccount } = await ShopService.createShop(shopData);

		// THAY ĐỔI 2: Gọi hàm generateAccessToken từ AuthService
		// Truyền vào account đã được cập nhật và populate roles
		const newAccessToken = AuthService.generateAccessToken(updatedAccount);

		// THAY ĐỔI 3: Gửi token mới về cho client
		return successResponse(
			res,
			{
				shop,
				newAccessToken,
			},
			"Tạo shop thành công"
		);
	} catch (error) {
		next(error);
	}
};

/**
 * Chủ shop tự đóng cửa hàng
 */
export const closeMyShop = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

		const result = await ShopService.closeMyShopByAccount(accountId);
		return successResponse(res, result, result.message);
	} catch (error) {
		next(error);
	}
};

/**
 * Chủ shop mở lại cửa hàng
 */
export const reopenMyShop = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

		const result = await ShopService.reopenMyShopByAccount(accountId);
		return successResponse(res, result, result.message);
	} catch (error) {
		next(error);
	}
};

/**
 * Cập nhật shop (chỉ chủ shop)
 */
export const editShop = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id; // || req.body.accountId;
		const updateData = req.body;
		const forbidden = ["accountId", "status"];
		forbidden.forEach((f) => delete updateData[f]);
	try {
		const { id } = req.params;
		const accountId = req.user?.id; // || req.body.accountId;
		const updateData = req.body;
		const forbidden = ["accountId", "status"];
		forbidden.forEach((f) => delete updateData[f]);

		validateObjectId(id, "ID shop");
		validateObjectId(accountId, "accID");
		validateObjectId(id, "ID shop");
		validateObjectId(accountId, "accID");

		const updatedShop = await ShopService.updateShop(id, accountId, updateData);
		return successResponse(res, updatedShop, "Cập nhật shop thành công");
	} catch (error) {
		// ApiError sẽ được xử lý bởi errorHandler middleware
		next(error);
	}
		const updatedShop = await ShopService.updateShop(id, accountId, updateData);
		return successResponse(res, updatedShop, "Cập nhật shop thành công");
	} catch (error) {
		// ApiError sẽ được xử lý bởi errorHandler middleware
		next(error);
	}
};

export const updateLogo = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id;
	try {
		const { id } = req.params;
		const accountId = req.user?.id;

		if (!req.file) throw ApiError.badRequest("Chưa upload file");
		const logoUrl = `/uploads/shops/${req.file.filename}`;
		if (!req.file) throw ApiError.badRequest("Chưa upload file");
		const logoUrl = `/uploads/shops/${req.file.filename}`;

		validateObjectId(id, "shopID");
		validateObjectId(accountId, "accID");
		validateObjectId(id, "shopID");
		validateObjectId(accountId, "accID");

		const updatedShop = await ShopService.updateShopImage(
			id,
			accountId,
			logoUrl,
			"logo"
		);
		const updatedShop = await ShopService.updateShopImage(
			id,
			accountId,
			logoUrl,
			"logo"
		);

		return successResponse(res, updatedShop, "Cập nhật logo shop thành công");
	} catch (error) {
		next(error);
	}
		return successResponse(res, updatedShop, "Cập nhật logo shop thành công");
	} catch (error) {
		next(error);
	}
};

export const updateCover = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id;
		if (!req.file) throw ApiError.badRequest("Chưa upload file cover");
		const coverUrl = `/uploads/shops/${req.file.filename}`;
	try {
		const { id } = req.params;
		const accountId = req.user?.id;
		if (!req.file) throw ApiError.badRequest("Chưa upload file cover");
		const coverUrl = `/uploads/shops/${req.file.filename}`;

		validateObjectId(id, "shopID");
		validateObjectId(accountId, "accID");
		validateObjectId(id, "shopID");
		validateObjectId(accountId, "accID");

		const updatedShop = await ShopService.updateShopImage(
			id,
			accountId,
			coverUrl,
			"cover"
		);
		return successResponse(
			res,
			updatedShop,
			"Cập nhật cover image shop thành công"
		);
	} catch (error) {
		next(error);
	}
		const updatedShop = await ShopService.updateShopImage(
			id,
			accountId,
			coverUrl,
			"cover"
		);
		return successResponse(
			res,
			updatedShop,
			"Cập nhật cover image shop thành công"
		);
	} catch (error) {
		next(error);
	}
};

export const updateDefaultLogo = async (req, res, next) => {
	try {
		if (!req.file)
			return next(ApiError.badRequest("Up cái logo lên coi bro 😎"));
	try {
		if (!req.file)
			return next(ApiError.badRequest("Up cái logo lên coi bro 😎"));

		const targetPath = path.join(process.cwd(), DEFAULT_LOGO);
		const targetPath = path.join(process.cwd(), DEFAULT_LOGO);

		// 1. Xóa file cũ nếu tồn tại
		if (fs.existsSync(targetPath)) {
			fs.unlinkSync(targetPath);
		}
		// 1. Xóa file cũ nếu tồn tại
		if (fs.existsSync(targetPath)) {
			fs.unlinkSync(targetPath);
		}

		// 2. Ghi đè file mới vào đúng tên
		fs.renameSync(req.file.path, targetPath);
		// 2. Ghi đè file mới vào đúng tên
		fs.renameSync(req.file.path, targetPath);

		return successResponse(
			res,
			{
				logoUrl: DEFAULT_LOGO,
			},
			"Logo mới fresh như bug-free code 💅"
		);
	} catch (err) {
		next(err);
	}
		return successResponse(
			res,
			{
				logoUrl: DEFAULT_LOGO,
			},
			"Logo mới fresh như bug-free code 💅"
		);
	} catch (err) {
		next(err);
	}
};

export const updateDefaultCover = async (req, res, next) => {
	try {
		if (!req.file) throw ApiError.badRequest("Up cover đi bạn eyyy");
	try {
		if (!req.file) throw ApiError.badRequest("Up cover đi bạn eyyy");

		const targetPath = path.join(process.cwd(), DEFAULT_COVER);
		const targetPath = path.join(process.cwd(), DEFAULT_COVER);

		// Delete old one
		if (fs.existsSync(targetPath)) {
			fs.unlinkSync(targetPath);
		}
		// Delete old one
		if (fs.existsSync(targetPath)) {
			fs.unlinkSync(targetPath);
		}

		// Replace new image with fixed filename
		fs.renameSync(req.file.path, targetPath);
		// Replace new image with fixed filename
		fs.renameSync(req.file.path, targetPath);

		return successResponse(
			res,
			{
				coverUrl: DEFAULT_COVER,
			},
			"Ảnh cover default mới đã được cập nhật 🎉"
		);
	} catch (err) {
		next(err);
	}
		return successResponse(
			res,
			{
				coverUrl: DEFAULT_COVER,
			},
			"Ảnh cover default mới đã được cập nhật 🎉"
		);
	} catch (err) {
		next(err);
	}
};

export const getDashboardStats = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const stats = await ShopService.getShopDashboardStats(accountId);
		return successResponse(res, stats, "Lấy thống kê thành công");
	} catch (error) {
		next(error);
	}
};

export const getDashboardStats = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const stats = await ShopService.getShopDashboardStats(accountId);
		return successResponse(res, stats, "Lấy thống kê thành công");
	} catch (error) {
		next(error);
	}
};

/**
 * Xóa vĩnh viễn shop (hard delete) của user đang đăng nhập
 * Xóa vĩnh viễn shop (hard delete) của user đang đăng nhập
 */
export const hardRemoveMyShop = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

		const result = await ShopService.hardDeleteShopByAccount(accountId);
		return successResponse(res, result, result.message);
	} catch (error) {
		next(error);
	}
};

export const getMyShopForManagement = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const shop = await ShopService.getMyShopForManagement(accountId);
		return successResponse(res, shop, "Lấy thông tin quản lý shop thành công");
	} catch (error) {
		next(error);
	}
};

/**
 * Chủ shop tự khôi phục shop
 */
export const restoreMyShop = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const result = await ShopService.restoreMyShopByAccount(accountId);
		return successResponse(res, result, result.message);
	} catch (error) {
		next(error);
	}
export const hardRemoveMyShop = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

		const result = await ShopService.hardDeleteShopByAccount(accountId);
		return successResponse(res, result, result.message);
	} catch (error) {
		next(error);
	}
};

export const getMyShopForManagement = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const shop = await ShopService.getMyShopForManagement(accountId);
		return successResponse(res, shop, "Lấy thông tin quản lý shop thành công");
	} catch (error) {
		next(error);
	}
};

/**
 * Chủ shop tự khôi phục shop
 */
export const restoreMyShop = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const result = await ShopService.restoreMyShopByAccount(accountId);
		return successResponse(res, result, result.message);
	} catch (error) {
		next(error);
	}
};

/**
 * Cập nhật trạng thái shop (admin hoặc chủ shop)
 */
export const changeStatus = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id; // || req.body.accountId;
		const { status } = req.body;
		validateObjectId(id, "shopID");
		validateObjectId(accountId, "accID");
	try {
		const { id } = req.params;
		const accountId = req.user?.id; // || req.body.accountId;
		const { status } = req.body;
		validateObjectId(id, "shopID");
		validateObjectId(accountId, "accID");

		// Gọi xuống service xử lý logic
		const updatedShop = await ShopService.updateShopStatus(
			id,
			accountId,
			status
		);
		// Gọi xuống service xử lý logic
		const updatedShop = await ShopService.updateShopStatus(
			id,
			accountId,
			status
		);

		return successResponse(
			res,
			updatedShop,
			"Cập nhật trạng thái shop thành công"
		);
	} catch (error) {
		next(error); // để middleware errorHandler xử lý
	}
		return successResponse(
			res,
			updatedShop,
			"Cập nhật trạng thái shop thành công"
		);
	} catch (error) {
		next(error); // để middleware errorHandler xử lý
	}
};

/**
 * Xóa các shop có accountId null (chỉ Super Admin)
 */
export const deleteNullShops = async (req, res, next) => {
	try {
		const adminAccountId = req.user?.id; // || req.body.accountId;
		validateObjectId(adminAccountId, "adminID");
	try {
		const adminAccountId = req.user?.id; // || req.body.accountId;
		validateObjectId(adminAccountId, "adminID");

		if (!adminAccountId) {
			return errorResponse(res, "Chưa đăng nhập", 401);
		}
		if (!adminAccountId) {
			return errorResponse(res, "Chưa đăng nhập", 401);
		}

		const result = await ShopService.deleteShopsWithNullAccount(adminAccountId);
		return successResponse(
			res,
			result,
			`Super Admin đã xóa ${result.deletedShops} shop null hoặc có accountId không tồn tại khỏi hệ thống và ${result.deletedProducts} sản phẩm thành công`
		);
	} catch (error) {
		// ApiError sẽ được xử lý bởi errorHandler middleware
		next(error);
	}
		const result = await ShopService.deleteShopsWithNullAccount(adminAccountId);
		return successResponse(
			res,
			result,
			`Super Admin đã xóa ${result.deletedShops} shop null hoặc có accountId không tồn tại khỏi hệ thống và ${result.deletedProducts} sản phẩm thành công`
		);
	} catch (error) {
		// ApiError sẽ được xử lý bởi errorHandler middleware
		next(error);
	}
};

export const restoreShop = async (req, res, next) => {
	try {
		const { id } = req.params;
		const adminAccountId = req.user?.id; // || req.body.accountId;
	try {
		const { id } = req.params;
		const adminAccountId = req.user?.id; // || req.body.accountId;

		validateObjectId(id, "shopID");
		validateObjectId(adminAccountId, "adminID");
		validateObjectId(id, "shopID");
		validateObjectId(adminAccountId, "adminID");

		const result = await ShopService.restoreShop(id, adminAccountId);
		return successResponse(res, result, "Khôi phục shop thành công");
	} catch (error) {
		next(error);
	}
		const result = await ShopService.restoreShop(id, adminAccountId);
		return successResponse(res, result, "Khôi phục shop thành công");
	} catch (error) {
		next(error);
	}
};
