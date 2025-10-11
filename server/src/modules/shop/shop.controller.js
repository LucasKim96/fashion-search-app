// server/src/modules/shop/shop.controller.js
import * as ShopService from "./shop.service.js";
import { apiResponse } from "../../utils/index.js";
import mongoose from "mongoose";

const { successResponse, errorResponse } = apiResponse;

/**
 * Lấy danh sách tất cả shop
 */
export const getShops = async (req, res) => {
  try {
    const shops = await ShopService.getShops();
    return successResponse(res, shops, "Lấy danh sách shop thành công");
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Lấy thông tin chi tiết shop theo ID
 */
export const getShop = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "ID shop không hợp lệ", 400);
    }
    const shop = await ShopService.getShopById(id);
    return successResponse(res, shop, "Lấy thông tin shop thành công");
  } catch (error) {
    return errorResponse(res, error, 404);
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
    return errorResponse(res, error, 400);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "ID shop không hợp lệ", 400);
    }

    const updatedShop = await ShopService.updateShop(id, accountId, updateData);
    return successResponse(res, updatedShop, "Cập nhật shop thành công");
  } catch (error) {
    return errorResponse(res, error, 400);
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
    return errorResponse(res, error, 400);
  }
};

/**
 * Cập nhật trạng thái shop (admin hoặc chủ shop)
 */
export const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "ID shop không hợp lệ", 400);
    }

    const shop = await ShopService.updateShopStatus(id, status);
    return successResponse(res, shop, "Cập nhật trạng thái shop thành công");
  } catch (error) {
    return errorResponse(res, error, 400);
  }
};
