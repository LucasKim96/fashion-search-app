// server/src/modules/shop/shop.controller.js
import * as ShopService from "./shop.service.js";
import { apiResponse } from "../../utils/index.js";
import { validateObjectId } from "../../utils/index.js";

const { successResponse, errorResponse } = apiResponse;

/**
 * Lấy danh sách tất cả shop
 */
export const getShops = async (req, res) => {
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
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết shop theo ID
 */
export const getShop = async (req, res) => {
  try {
    const { id } = req.params;
    validateObjectId(id, "ID shop");
    const shop = await ShopService.getShopById(id);
    return successResponse(res, shop, "Lấy thông tin shop thành công");
  } catch (error) {
    // ApiError sẽ được xử lý bởi errorHandler middleware
    throw error;
  }
};

/**
 * Tạo shop mới
 */
export const addShop = async (req, res) => {
  try {
    const accountId = req.user?._id || req.body.accountId; // lấy từ middleware verifyToken
    const shopData = { ...req.body, accountId };

    const newShop = await ShopService.createShop(shopData);
    return successResponse(res, newShop, "Tạo shop thành công", 201);
  } catch (error) {
    // ApiError sẽ được xử lý bởi errorHandler middleware
    throw error;
  }
};

/**
 * Cập nhật shop (chỉ chủ shop)
 */
export const editShop = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.user?._id || req.body.accountId;
    const updateData = req.body;
    const forbidden = ["accountId", "status"];
    forbidden.forEach((f) => delete updateData[f]);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "ID shop không hợp lệ", 400);
    }

    const updatedShop = await ShopService.updateShop(id, accountId, updateData);
    return successResponse(res, updatedShop, "Cập nhật shop thành công");
  } catch (error) {
    // ApiError sẽ được xử lý bởi errorHandler middleware
    throw error;
  }
};

/**
 * Xóa shop (chỉ chủ shop)
 */
export const removeShop = async (req, res) => {
  try {
    const { id } = req.params;
    const accountId = req.user?._id || req.body.accountId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "ID shop không hợp lệ", 400);
    }

    const result = await ShopService.deleteShop(id, accountId);
    return successResponse(res, result, "Xóa shop thành công");
  } catch (error) {
    // ApiError sẽ được xử lý bởi errorHandler middleware
    throw error;
  }
};

/**
 * Cập nhật trạng thái shop (admin hoặc chủ shop)
 */
export const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "ID shop không hợp lệ", 400);
    }

    // Kiểm tra đăng nhập
    if (!req.user) return errorResponse(res, "Chưa đăng nhập", 401);

    const { _id, maxLevel } = req.user;
    const shop = await ShopService.getShopById(id);
    if (!shop) return errorResponse(res, "Không tìm thấy shop", 404);

    // Chỉ admin (>=3) hoặc chủ shop (chính chủ) được phép
    if (maxLevel < 3 && shop.accountId.toString() !== _id.toString()) {
      return errorResponse(
        res,
        "Không có quyền cập nhật trạng thái shop này",
        403
      );
    }

    // Cập nhật
    const updatedShop = await ShopService.updateShopStatus(id, status);
    return successResponse(
      res,
      updatedShop,
      "Cập nhật trạng thái shop thành công"
    );
  } catch (error) {
    // ApiError sẽ được xử lý bởi errorHandler middleware
    throw error;
  }
};

/**
 * Xóa các shop có accountId null (chỉ Super Admin)
 */
export const deleteNullShops = async (req, res) => {
  try {
    const adminAccountId = req.user?._id || req.body.accountId;

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
    throw error;
  }
};
