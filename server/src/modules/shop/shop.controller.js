// server/src/modules/shop/shop.controller.js
import * as ShopService from "./shop.service.js";
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

		// Parse filters
		const filters = {};
		if (status) filters.status = status;
		if (shopName) filters.shopName = shopName;

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

/**
 * Tạo shop mới
 */
export const createShop = async (req, res, next) => {
	try {
		// 1. Lấy dữ liệu text từ req.body
		const { shopName, description } = req.body;
		const accountId = req.user?.id; // Từ authMiddleware

		// 2. DEBUG: KIỂM TRA XEM FILE ĐÃ LÊN ĐẾN SERVER CHƯA
		// Thêm dòng log này để xem multer có hoạt động không.
		// Nếu req.files là undefined, nghĩa là middleware upload của bạn chưa được áp dụng đúng vào route.
		console.log("Request Files:", req.files);

		// 3. Xử lý đường dẫn file (Phần quan trọng nhất)
		let logoUrl = null; // Khởi tạo là null
		let coverUrl = null;

		// Chỉ tạo URL nếu file thực sự tồn tại trong request
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

		// 4. DEBUG: KIỂM TRA URL ĐƯỢC TẠO RA
		// Xem các URL này có đúng định dạng bạn mong muốn không.
		console.log("Generated Logo URL:", logoUrl);
		console.log("Generated Cover URL:", coverUrl);

		// 5. Gói dữ liệu để gửi vào service
		const shopData = {
			shopName,
			description,
			accountId,
			logoUrl, // Truyền URL đã được xử lý (hoặc null)
			coverUrl, // Truyền URL đã được xử lý (hoặc null)
		};

		const newShop = await ShopService.createShop(shopData);

		return successResponse(res, newShop, "Tạo shop thành công");
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

		validateObjectId(id, "ID shop");
		validateObjectId(accountId, "accID");

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
		const accountId = req.user?.id; // || req.body.accountId;

		if (!req.file) throw ApiError.badRequest("Chưa upload file");
		const logoUrl = `/uploads/shops/${id}/${req.file.filename}`;

		validateObjectId(id, "shopID");
		validateObjectId(accountId, "accID");

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

export const updateCover = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id; // || req.body.accountId;
		if (!req.file) throw ApiError.badRequest("Chưa upload file cover");
		const coverUrl = `/uploads/shops/${id}/${req.file.filename}`;

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
};

export const updateDefaultLogo = async (req, res, next) => {
	try {
		if (!req.file)
			return next(ApiError.badRequest("Up cái logo lên coi bro 😎"));

		const targetPath = path.join(process.cwd(), DEFAULT_LOGO);

		// 1. Xóa file cũ nếu tồn tại
		if (fs.existsSync(targetPath)) {
			fs.unlinkSync(targetPath);
		}

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
};

export const updateDefaultCover = async (req, res, next) => {
	try {
		if (!req.file) throw ApiError.badRequest("Up cover đi bạn eyyy");

		const targetPath = path.join(process.cwd(), DEFAULT_COVER);

		// Delete old one
		if (fs.existsSync(targetPath)) {
			fs.unlinkSync(targetPath);
		}

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
};

/**
 * Xóa shop (chỉ chủ shop)
 */
export const removeShop = async (req, res, next) => {
	try {
		const { id } = req.params;
		const accountId = req.user?.id; // || req.body.accountId;

		validateObjectId(id, "ID shop");
		validateObjectId(accountId, "accID");

		const result = await ShopService.deleteShop(id, accountId);
		return successResponse(res, result, "Xóa shop thành công");
	} catch (error) {
		// ApiError sẽ được xử lý bởi errorHandler middleware
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
};

/**
 * Xóa các shop có accountId null (chỉ Super Admin)
 */
export const deleteNullShops = async (req, res, next) => {
	try {
		const adminAccountId = req.user?.id; // || req.body.accountId;
		validateObjectId(adminAccountId, "adminID");

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
};

export const restoreShop = async (req, res, next) => {
	try {
		const { id } = req.params;
		const adminAccountId = req.user?.id; // || req.body.accountId;

		validateObjectId(id, "shopID");
		validateObjectId(adminAccountId, "adminID");

		const result = await ShopService.restoreShop(id, adminAccountId);
		return successResponse(res, result, "Khôi phục shop thành công");
	} catch (error) {
		next(error);
	}
};
