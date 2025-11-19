"use client";

import { useState, useEffect, useCallback } from "react";
import { useNotification, errorUtils } from "@shared/core";
import { Cart } from "./cart.types";
import {
	getMyCartApi,
	updateCartItemQuantityApi,
	removeCartItemApi,
} from "./cart.api";

export const useCart = () => {
	const [cart, setCart] = useState<Cart | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { showToast } = useNotification();

	// Hàm để tải/làm mới giỏ hàng
	const fetchCart = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getMyCartApi();
			if (res.success) {
				setCart(res.data);
			} else {
				setError(res.message || "Không thể tải giỏ hàng.");
			}
		} catch (err) {
			const message = errorUtils.parseApiError(err);
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	// Tải giỏ hàng lần đầu khi hook được sử dụng
	useEffect(() => {
		fetchCart();
	}, [fetchCart]);

	// Hàm cập nhật số lượng
	const updateItemQuantity = useCallback(
		async (productVariantId: string, quantity: number) => {
			try {
				const res = await updateCartItemQuantityApi(productVariantId, {
					quantity,
				});
				if (res.success && res.data) {
					setCart(res.data); // Cập nhật giỏ hàng với dữ liệu mới từ server
					showToast("Cập nhật giỏ hàng thành công!", "success");
				} else {
					showToast(res.message || "Cập nhật thất bại.", "error");
				}
			} catch (err) {
				showToast(errorUtils.parseApiError(err), "error");
			}
		},
		[showToast]
	);

	// Hàm xóa sản phẩm
	const removeItem = useCallback(
		async (productVariantId: string) => {
			try {
				const res = await removeCartItemApi(productVariantId);
				if (res.success && res.data) {
					setCart(res.data);
					showToast("Đã xóa sản phẩm khỏi giỏ hàng.", "success");
				} else {
					showToast(res.message || "Xóa thất bại.", "error");
				}
			} catch (err) {
				showToast(errorUtils.parseApiError(err), "error");
			}
		},
		[showToast]
	);

	return {
		cart,
		loading,
		error,
		fetchCart, // Export để có thể refresh thủ công nếu cần
		updateItemQuantity,
		removeItem,
	};
};
