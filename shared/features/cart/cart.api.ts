// file: shared/features/cart/cart.api.ts

import { axiosInstance, CART_ENDPOINTS } from "@shared/core";
import { ApiResponse } from "@shared/types/common.types";
import { Cart, AddToCartRequest, UpdateCartItemRequest } from "./cart.types";

/** Lấy giỏ hàng của user hiện tại */
export const getMyCartApi = () =>
	axiosInstance
		.get<ApiResponse<Cart>>(CART_ENDPOINTS.GET_MY_CART)
		.then((res) => res.data);

/** Thêm sản phẩm vào giỏ hàng */
export const addItemToCartApi = (payload: AddToCartRequest) =>
	axiosInstance
		.post<ApiResponse<Cart>>(CART_ENDPOINTS.ADD_ITEM, payload)
		.then((res) => res.data);

/** Cập nhật số lượng sản phẩm */
export const updateCartItemQuantityApi = (
	productVariantId: string,
	payload: UpdateCartItemRequest
) =>
	axiosInstance
		.put<ApiResponse<Cart>>(
			CART_ENDPOINTS.UPDATE_ITEM_QUANTITY(productVariantId),
			payload
		)
		.then((res) => res.data);

/** Xóa sản phẩm khỏi giỏ hàng */
export const removeCartItemApi = (productVariantId: string) =>
	axiosInstance
		.delete<ApiResponse<Cart>>(CART_ENDPOINTS.REMOVE_ITEM(productVariantId))
		.then((res) => res.data);

/** Xóa toàn bộ giỏ hàng */
export const clearCartApi = () =>
	axiosInstance
		.delete<ApiResponse>(CART_ENDPOINTS.CLEAR_CART)
		.then((res) => res.data);
