// server/src/modules/shop/shop.controller.js
import * as ShopService from "./shop.service.js";
import { apiResponse } from "../../utils/index.js";
import { validateObjectId, validateURL } from "../../utils/index.js";

const { successResponse, errorResponse } = apiResponse;

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

/**
 * Tạo shop mới
 */
export const addShop = async (req, res, next) => {
  try {
    const accountId = req.user?.id; // || req.body.accountId;
    const shopData = { ...req.body, accountId };

    validateObjectId(accountId, "accID");

    const newShop = await ShopService.createShop(shopData);
    return successResponse(res, newShop, "Tạo shop thành công", 201);
  } catch (error) {
    // ApiError sẽ được xử lý bởi errorHandler middleware
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
    const { logoUrl } = req.body;

    validateObjectId(id, "shopID");
    validateObjectId(accountId, "accID");
    validateURL(logoUrl, "logo", true);

    const updatedShop = await ShopService.updateLogo(id, accountId, logoUrl);
    return successResponse(res, updatedShop, "Cập nhật avatar shop thành công");
  } catch (error) {
    next(error);
  }
};

export const updateCoverImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.id; // || req.body.accountId;
    const { coverUrl } = req.body;

    validateObjectId(id, "shopID");
    validateObjectId(accountId, "accID");
    validateURL(coverUrl, "coverImage", true);

    const updatedShop = await ShopService.updateCoverImage(
      id,
      accountId,
      coverUrl
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
    // console.log("accountId:", accountId);
    // console.log("status:", status);
    // console.log("id:", id);
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
