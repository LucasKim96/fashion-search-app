"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getPublicProducts } from "./product.api";
import { Product, ProductListItem } from "./product.types";
import { errorUtils } from "@shared/core/utils";
import { useNotification } from "@shared/core/ui/NotificationProvider";

/**
 * Helper: Chuyển đổi dữ liệu Product thô sang ProductListItem cho UI.
 */
const mapProductToListItem = (product: Product): ProductListItem => ({
	_id: product._id,
	name: product.pdName,
	basePrice: product.basePrice,
	thumbnail: product.images?.[0] || "",
});

/**
 * Hook chuyên dụng để lấy danh sách sản phẩm cho các trang public.
 */
export const usePublicProducts = (
	options: { page?: number; limit?: number } = {}
) => {
	const [products, setProducts] = useState<ProductListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [totalPages, setTotalPages] = useState(1);
	const { showToast } = useNotification();

	const fetchProducts = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await getPublicProducts({
				page: options.page,
				limit: options.limit,
			}); // {limit: options.limit}
			if (res.success && res.data && res.data.products) {
				// Map mảng products bên trong object data
				setProducts(res.data.products.map(mapProductToListItem));

				// Lấy totalPages từ pagination
				setTotalPages(res.data.pagination?.totalPages || 1);
			} else {
				// Logic lỗi giữ nguyên
				const msg = res.message || "Không thể tải sản phẩm.";
				setError(msg);
				// showToast(msg, "error"); // Có thể bỏ showToast ở đây để tránh spam lỗi khi lướt web
			}
		} catch (err) {
			const msg = errorUtils.parseApiError(err);
			setError(msg);
			showToast(msg, "error");
		} finally {
			setLoading(false);
		}
	}, [options.page, options.limit, showToast]);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	// Bọc giá trị trả về bằng useMemo để ổn định tham chiếu
	return useMemo(
		() => ({
			products,
			loading,
			error,
			totalPages,
			refetch: fetchProducts,
		}),
		[products, loading, error, totalPages, fetchProducts]
	);
};
