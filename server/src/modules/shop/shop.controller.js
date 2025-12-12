// server/src/modules/shop/shop.controller.js
import * as ShopService from "./shop.service.js";
import * as AuthService from "../auth/auth.service.js";
import { apiResponse, ApiError, validateObjectId } from "../../utils/index.js";
import path from "path";
import fs from "fs";

const { successResponse } = apiResponse;
const DEFAULT_LOGO = "assets/shop/default-logo.png";
const DEFAULT_COVER = "assets/shop/default-cover.jpg";

/**
 * Lấy danh sách tất cả shop
 */
export const getShops = async (req, res, next) => {
	try {
		const { page, limit, status, shopName } = req.query;

		const filters = {};
		if (status) filters.status = status;
		if (shopName) filters.shopName = shopName;

		const options = {};
		if (page) options.page = page;
		if (limit) options.limit = limit;

		const result = await ShopService.getShops(filters, options);
		return successResponse(res, result, "Lấy danh sách shop thành công");
	} catch (error) {
		next(error);
	}
};

/**
 * Lấy thông tin chi tiết shop theo ID
 */
export const getShop = async (req, res, next) => {
	try {
		const { id } = req.params;
		validateObjectId(id, "ID shop");

		const shop = await ShopService.getShopById(id);
		return successResponse(res, shop, "Lấy thông tin shop thành công");
	} catch (error) {
		next(error);
	}
};

/**
 * Lấy thông tin chi tiết shop của chính user đang đăng nhập
 */
export const getMyShopDetails = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const shop = await ShopService.getShopByAccountId(accountId);
		return successResponse(res, shop, "Lấy thông tin shop thành công");
	} catch (error) {
		next(error);
	}
};

/**
 * Tạo shop mới
 */
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

		const { shop, updatedAccount } = await ShopService.createShop(shopData);
		const newAccessToken = AuthService.generateAccessToken(updatedAccount);

		return successResponse(
			res,
			{ shop, newAccessToken },
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
 * Cập nhật thông tin shop (chỉ chủ shop)
 */
export const editShop = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id;
		const updateData = req.body;
		const forbidden = ["accountId", "status"];
		forbidden.forEach((f) => delete updateData[f]);

		validateObjectId(id, "ID shop");
		validateObjectId(accountId, "ID tài khoản");

		const updatedShop = await ShopService.updateShop(id, accountId, updateData);
		return successResponse(res, updatedShop, "Cập nhật shop thành công");
	} catch (error) {
		next(error);
	}
};

/**
 * Cập nhật logo shop
 */
export const updateLogo = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id;

		if (!req.file) throw ApiError.badRequest("Chưa upload file logo");
		const logoUrl = `/uploads/shops/${req.file.filename}`;

		validateObjectId(id, "ID shop");
		validateObjectId(accountId, "ID tài khoản");

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
};

/**
 * Cập nhật ảnh bìa shop
 */
export const updateCover = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id;
		if (!req.file) throw ApiError.badRequest("Chưa upload file ảnh bìa");
		const coverUrl = `/uploads/shops/${req.file.filename}`;

		validateObjectId(id, "ID shop");
		validateObjectId(accountId, "ID tài khoản");

		const updatedShop = await ShopService.updateShopImage(
			id,
			accountId,
			coverUrl,
			"cover"
		);
		return successResponse(
			res,
			updatedShop,
			"Cập nhật ảnh bìa shop thành công"
		);
	} catch (error) {
		next(error);
	}
};

/**
 * Cập nhật logo mặc định (Admin)
 */
export const updateDefaultLogo = async (req, res, next) => {
	try {
		if (!req.file) throw ApiError.badRequest("Chưa upload file logo");

		const targetPath = path.join(process.cwd(), DEFAULT_LOGO);
		if (fs.existsSync(targetPath)) {
			fs.unlinkSync(targetPath);
		}
		fs.renameSync(req.file.path, targetPath);

		return successResponse(
			res,
			{ logoUrl: DEFAULT_LOGO },
			"Cập nhật logo mặc định thành công"
		);
	} catch (err) {
		next(err);
	}
};

/**
 * Cập nhật ảnh bìa mặc định (Admin)
 */
export const updateDefaultCover = async (req, res, next) => {
	try {
		if (!req.file) throw ApiError.badRequest("Chưa upload file ảnh bìa");

		const targetPath = path.join(process.cwd(), DEFAULT_COVER);
		if (fs.existsSync(targetPath)) {
			fs.unlinkSync(targetPath);
		}
		fs.renameSync(req.file.path, targetPath);

		return successResponse(
			res,
			{ coverUrl: DEFAULT_COVER },
			"Cập nhật ảnh bìa mặc định thành công"
		);
	} catch (err) {
		next(err);
	}
};

/**
 * Lấy thống kê cho dashboard của shop
 */
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

/**
 * Lấy thông tin shop để quản lý (của user đang đăng nhập)
 */
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
 * Chủ shop tự khôi phục shop đã đóng
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
 * Cập nhật trạng thái shop (chỉ Admin)
 */
export const changeStatus = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id;
		const { status } = req.body;

		validateObjectId(id, "ID shop");
		validateObjectId(accountId, "ID tài khoản");

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
		next(error);
	}
};

/**
 * Xóa các shop có accountId null (chỉ Super Admin)
 */
export const deleteNullShops = async (req, res, next) => {
	try {
		const adminAccountId = req.user?.id;
		validateObjectId(adminAccountId, "ID admin");

		const result = await ShopService.deleteShopsWithNullAccount(adminAccountId);
		return successResponse(
			res,
			result,
			`Đã xóa ${result.deletedShops} shop và ${result.deletedProducts} sản phẩm không hợp lệ`
		);
	} catch (error) {
		next(error);
	}
};

/**
 * Khôi phục shop đã bị xóa mềm (chỉ Admin)
 */
export const restoreShop = async (req, res, next) => {
	try {
		const { id } = req.params;
		const adminAccountId = req.user?.id;

		validateObjectId(id, "ID shop");
		validateObjectId(adminAccountId, "ID admin");

		const result = await ShopService.restoreShop(id, adminAccountId);
		return successResponse(res, result, "Khôi phục shop thành công");
	} catch (error) {
		next(error);
	}
};
