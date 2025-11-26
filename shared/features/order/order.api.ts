import { axiosInstance } from "@shared/core/api/axiosInstance";
import { ORDER_ENDPOINTS } from "@shared/core/constants/api.constants";
import { ApiResponse } from "@shared/types/common.types";
import { Order, OrderListResponse, OrderStatus } from "./order.types"; // Đảm bảo bạn đã export các type này

// --- HELPER: Tạo URL gốc cho từng Role ---
// Kết quả VD: "/orders/buyer", "/orders/seller", "/orders/admin"
const BUYER_ROOT = `${ORDER_ENDPOINTS.BASE}${ORDER_ENDPOINTS.BUYER.BASE}`;
const SELLER_ROOT = `${ORDER_ENDPOINTS.BASE}${ORDER_ENDPOINTS.SELLER.BASE}`;
const ADMIN_ROOT = `${ORDER_ENDPOINTS.BASE}${ORDER_ENDPOINTS.ADMIN.BASE}`;

/** ========================= 1. BUYER API ========================= */

interface GetMyOrdersParams {
	page?: number;
	limit?: number;
	status?: OrderStatus | "all";
}

// Lấy danh sách đơn hàng của tôi
export const getMyOrdersApi = async (params: GetMyOrdersParams) => {
	const url = `${BUYER_ROOT}${ORDER_ENDPOINTS.BUYER.GET_MY_ORDERS}`;
	const res = await axiosInstance.get<ApiResponse<OrderListResponse>>(url, {
		params,
	});
	return res.data;
};

// Lấy chi tiết đơn hàng
export const getMyOrderDetailApi = async (orderId: string) => {
	const url = `${BUYER_ROOT}${ORDER_ENDPOINTS.BUYER.GET_DETAIL}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.get<ApiResponse<Order>>(url);
	return res.data;
};

// Tạo đơn hàng từ giỏ hàng
export const createOrderFromCartApi = async (payload: {
	addressLine: string;
	receiverName: string;
	phone: string;
	note?: string;
}) => {
	const url = `${BUYER_ROOT}${ORDER_ENDPOINTS.BUYER.CREATE_FROM_CART}`;
	const res = await axiosInstance.post<ApiResponse<any>>(url, payload);
	return res.data;
};

// Xác nhận đã nhận hàng
export const confirmReceivedApi = async (orderId: string) => {
	const url = `${BUYER_ROOT}${ORDER_ENDPOINTS.BUYER.CONFIRM}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.patch<ApiResponse<Order>>(url);
	return res.data;
};

// Báo cáo sự cố
export const reportIssueApi = async (orderId: string, note: string) => {
	const url = `${BUYER_ROOT}${ORDER_ENDPOINTS.BUYER.REPORT}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.post<ApiResponse<any>>(url, { note });
	return res.data;
};

// Hủy đơn hàng (khi còn pending)
export const cancelMyOrderApi = async (orderId: string) => {
	const url = `${BUYER_ROOT}${ORDER_ENDPOINTS.BUYER.CANCEL}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.patch<ApiResponse<Order>>(url);
	return res.data;
};

/** ========================= 2. SELLER API ========================= */

interface GetShopOrdersParams {
	page?: number;
	limit?: number;
	status?: OrderStatus | "all";
}

// Lấy danh sách đơn hàng của Shop
export const getShopOrdersApi = async (params: GetShopOrdersParams) => {
	const url = `${SELLER_ROOT}${ORDER_ENDPOINTS.SELLER.GET_SHOP_ORDERS}`;
	const res = await axiosInstance.get<ApiResponse<OrderListResponse>>(url, {
		params,
	});
	return res.data;
};

// Lấy chi tiết đơn hàng (Góc nhìn của Shop)
export const getShopOrderDetailApi = async (orderId: string) => {
	const url = `${SELLER_ROOT}/${orderId}`;

	const res = await axiosInstance.get<ApiResponse<Order>>(url);
	return res.data;
};

// Đánh dấu đang đóng gói
export const markPackingApi = async (orderId: string) => {
	const url = `${SELLER_ROOT}${ORDER_ENDPOINTS.SELLER.MARK_PACKING}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.patch<ApiResponse<Order>>(url);
	return res.data;
};

// Đánh dấu đang giao
export const markShippingApi = async (orderId: string) => {
	const url = `${SELLER_ROOT}${ORDER_ENDPOINTS.SELLER.MARK_SHIPPING}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.patch<ApiResponse<Order>>(url);
	return res.data;
};

// Đánh dấu đã giao hàng
export const markDeliveredApi = async (orderId: string) => {
	const url = `${SELLER_ROOT}${ORDER_ENDPOINTS.SELLER.MARK_DELIVERED}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.patch<ApiResponse<Order>>(url);
	return res.data;
};

// Shop hủy đơn
export const cancelBySellerApi = async (orderId: string, reason: string) => {
	const url = `${SELLER_ROOT}${ORDER_ENDPOINTS.SELLER.CANCEL}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.patch<ApiResponse<any>>(url, { reason });
	return res.data;
};

/** ========================= 3. ADMIN API ========================= */

// Admin hoàn tất đơn
export const adminCompleteOrderApi = async (orderId: string) => {
	const url = `${ADMIN_ROOT}${ORDER_ENDPOINTS.ADMIN.COMPLETE}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.patch<ApiResponse<Order>>(url);
	return res.data;
};

// Admin hủy đơn
export const adminCancelOrderApi = async (orderId: string, reason: string) => {
	const url = `${ADMIN_ROOT}${ORDER_ENDPOINTS.ADMIN.CANCEL}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.patch<ApiResponse<any>>(url, { reason });
	return res.data;
};

// Admin xử lý báo cáo (tranh chấp)
export const reviewReportedOrderApi = async (
	orderId: string,
	action: "approve_buyer" | "approve_seller" | "cancel_both",
	note?: string
) => {
	const url = `${ADMIN_ROOT}${ORDER_ENDPOINTS.ADMIN.REVIEW_REPORT}`.replace(
		":id",
		orderId
	);
	const res = await axiosInstance.post<ApiResponse<any>>(url, { action, note });
	return res.data;
};
