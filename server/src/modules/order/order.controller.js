// server/src/modules/order/order.controller.js
import * as OrderService from "./order.service.js";
import { apiResponse } from "../../utils/index.js";
import ApiError from "../../utils/apiError.js";

const { successResponse, errorResponse } = apiResponse;

/**
 * Tạo đơn hàng từ giỏ hàng
 */
export const createOrder = async (req, res) => {
  try {
    const accountId = req.user?._id;

    if (!accountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    const { addressLine, receiverName, phone, note } = req.body;

    const order = await OrderService.createOrderFromCart(accountId, {
      addressLine,
      receiverName,
      phone,
      note,
    });

    return successResponse(res, order, "Đặt hàng thành công", 201);
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách đơn hàng của user
 */
export const getMyOrders = async (req, res) => {
  try {
    const accountId = req.user?._id;

    if (!accountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    const { page, limit, status } = req.query;

    const options = {};
    if (page) options.page = parseInt(page);
    if (limit) options.limit = parseInt(limit);
    if (status) options.status = status;

    const result = await OrderService.getOrdersByAccount(
      accountId,
      {},
      options
    );

    return successResponse(res, result, "Lấy danh sách đơn hàng thành công");
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy chi tiết đơn hàng
 */
export const getOrderDetail = async (req, res) => {
  try {
    const accountId = req.user?._id;
    const { id } = req.params;

    if (!accountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    const order = await OrderService.getOrderById(id, accountId);

    return successResponse(res, order, "Lấy chi tiết đơn hàng thành công");
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật trạng thái đơn hàng (shop owner hoặc admin)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const updaterAccountId = req.user?._id;
    const { id } = req.params;
    const { status } = req.body;

    if (!updaterAccountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    if (!status) {
      return errorResponse(res, "Thiếu trạng thái mới", 400);
    }

    const order = await OrderService.updateOrderStatus(
      id,
      status,
      updaterAccountId
    );

    return successResponse(
      res,
      order,
      "Cập nhật trạng thái đơn hàng thành công"
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Hủy đơn hàng
 */
export const cancelOrder = async (req, res) => {
  try {
    const accountId = req.user?._id;
    const { id } = req.params;

    if (!accountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    const order = await OrderService.cancelOrder(id, accountId);

    return successResponse(res, order, "Hủy đơn hàng thành công");
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy thống kê đơn hàng cho shop (TODO)
 */
export const getShopOrderStats = async (req, res) => {
  try {
    const { shopId } = req.params;

    // TODO: Implement sau khi có đủ logic phân quyền
    const stats = await OrderService.getShopOrderStats(shopId);

    return successResponse(res, stats, "Lấy thống kê đơn hàng thành công");
  } catch (error) {
    throw error;
  }
};
