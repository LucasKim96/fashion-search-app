import * as OrderService from "./order.service.js";
import { apiResponse, ApiError, validateObjectId } from "../../utils/index.js";

const { successResponse } = apiResponse;

/**
 * Buyer: Lấy danh sách đơn hàng của chính mình
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    validateObjectId(accountId, "accountId");

    const result = await OrderService.getOrdersByBuyer(accountId, req.query);
    return successResponse(
      res,
      result,
      "Lấy danh sách đơn hàng của bạn thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Buyer: Lấy chi tiết 1 đơn hàng
 */
export const getMyOrderDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.id;

    validateObjectId(id, "orderId");
    validateObjectId(accountId, "accountId");

    const order = await OrderService.getOrderDetailForBuyer(id, accountId);
    return successResponse(res, order, "Chi tiết đơn hàng của bạn nè 💌");
  } catch (err) {
    next(err);
  }
};

/**
 * Buyer: Tạo đơn hàng từ giỏ hàng
 */
export const createFromCart = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    validateObjectId(accountId, "accountId");

    const orderData = req.body; // chứa addressLine, receiverName, phone, note...
    const result = await OrderService.createOrderFromCart(accountId, orderData);
    return successResponse(res, result, "Đặt hàng thành công 🎉", 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Buyer: Xác nhận đã nhận hàng
 */
export const confirmReceived = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.id;

    validateObjectId(id, "orderId");
    validateObjectId(accountId, "accountId");

    const result = await OrderService.confirmOrderReceived(id, accountId);
    return successResponse(res, result, "Đã xác nhận nhận hàng thành công ✅");
  } catch (err) {
    next(err);
  }
};

/**
 * Buyer: Báo cáo sự cố đơn hàng
 */
export const reportIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.id;
    const { note } = req.body;

    validateObjectId(id, "orderId");
    validateObjectId(accountId, "accountId");

    const result = await OrderService.reportOrderIssue(id, accountId, note);
    return successResponse(res, result, "Đã gửi báo cáo cho admin xử lý 🚨");
  } catch (err) {
    next(err);
  }
};

/**
 * Buyer: Hủy đơn khi còn pending
 */
export const cancelMyOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accountId = req.user?.id;

    validateObjectId(id, "orderId");
    validateObjectId(accountId, "accountId");

    const result = await OrderService.cancelOrderByBuyer(id, accountId);
    return successResponse(res, result, "Đã hủy đơn hàng của bạn 💔");
  } catch (err) {
    next(err);
  }
};

/**
 * Seller huỷ đơn hàng
 */
export const cancelBySeller = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user?.id;
    const { reason } = req.body;

    validateObjectId(orderId, "ID đơn hàng");
    validateObjectId(sellerId, "ID người bán");

    const result = await OrderService.cancelBySeller(orderId, sellerId, reason);
    return successResponse(res, result, "Huỷ đơn hàng thành công");
  } catch (error) {
    next(error);
  }
};

/**
 * Seller: Lấy danh sách đơn của shop
 */
export const getShopOrders = async (req, res, next) => {
  try {
    const shopId = req.user?.shopId;
    validateObjectId(shopId, "shopId");

    const result = await OrderService.getOrdersByShop(shopId, req.query);
    return successResponse(
      res,
      result,
      "Lấy danh sách đơn hàng của shop thành công"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Seller: Đánh dấu đang đóng gói
 */
export const markPacking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;
    validateObjectId(id, "orderId");
    validateObjectId(shopId, "shopId");

    const result = await OrderService.updateStatusPacking(id, shopId);
    return successResponse(
      res,
      result,
      "Đơn hàng đã chuyển sang trạng thái 'packing' 📦"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Seller: Đánh dấu đang giao
 */
export const markShipping = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;
    validateObjectId(id, "orderId");
    validateObjectId(shopId, "shopId");

    const result = await OrderService.updateStatusShipping(id, shopId);
    return successResponse(
      res,
      result,
      "Đơn hàng đã chuyển sang 'shipping' 🚚"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Seller: Đánh dấu đã giao hàng
 */
export const markDelivered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shopId = req.user?.shopId;
    validateObjectId(id, "orderId");
    validateObjectId(shopId, "shopId");

    const result = await OrderService.updateStatusDelivered(id, shopId);
    return successResponse(
      res,
      result,
      "Đã đánh dấu đơn hàng là 'delivered' 📬"
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Hoàn tất đơn thủ công
 */
export const adminCompleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    validateObjectId(id, "orderId");
    validateObjectId(adminId, "adminId");

    const result = await OrderService.forceCompleteOrder(id, adminId);
    return successResponse(res, result, "Admin đã hoàn tất đơn hàng 🧾");
  } catch (err) {
    next(err);
  }
};

// Admin huỷ đơn
export const adminCancelOrder = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const adminId = req.user?.id;
    const { reason } = req.body;

    validateObjectId(orderId, "ID đơn hàng");
    const result = await OrderService.adminCancelOrder(
      orderId,
      adminId,
      reason
    );

    return successResponse(res, result, "Admin đã huỷ đơn hàng thành công");
  } catch (error) {
    next(error);
  }
};

// Admin xử lý đơn có report
export const reviewReportedOrder = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const adminId = req.user?.id;
    const { action, note } = req.body;
    // action: "approve_buyer" | "approve_seller" | "cancel_both"

    validateObjectId(orderId, "ID đơn hàng");
    const result = await OrderService.reviewReportedOrder(
      orderId,
      adminId,
      action,
      note
    );

    return successResponse(res, result, "Đã xử lý báo cáo đơn hàng");
  } catch (error) {
    next(error);
  }
};

// Cron job / auto transition orders
export const autoTransitionOrders = async (req, res, next) => {
  try {
    const result = await OrderService.autoTransitionOrders();
    return successResponse(res, result, "Đã auto cập nhật trạng thái đơn hàng");
  } catch (error) {
    next(error);
  }
};
