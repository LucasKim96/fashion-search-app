"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getPublicProducts } from "./product.api";
import { Product, ProductListItem } from "./product.types";
import { errorUtils, useNotification } from "@shared/core";

/**
 * Helper: Chuyển đổi dữ liệu Product thô sang ProductListItem cho UI.
 */
const mapProductToListItem = (product: Product): ProductListItem => ({
	_id: product._id,
	name: product.pdName,
	basePrice: product.basePrice,
	thumbnail: product.images?.[0],
});

/**
 * Hook chuyên dụng để lấy danh sách sản phẩm cho các trang public.
 */
export const usePublicProducts = (options: { limit?: number } = {}) => {
	const [products, setProducts] = useState<ProductListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { showToast } = useNotification();

	const fetchProducts = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await getPublicProducts(); // {limit: options.limit}
			if (res.success && Array.isArray(res.data)) {
				setProducts(res.data.map(mapProductToListItem));
			} else {
				const msg = res.message || "Không thể tải sản phẩm.";
				setError(msg);
				showToast(msg, "error");
			}
		} catch (err) {
			const msg = errorUtils.parseApiError(err);
			setError(msg);
			showToast(msg, "error");
		} finally {
			setLoading(false);
		}
	}, [options.limit, showToast]);

	useEffect(() => {
		fetchProducts();
	}, [fetchProducts]);

	// Bọc giá trị trả về bằng useMemo để ổn định tham chiếu
	return useMemo(
		() => ({
			products,
			loading,
			error,
			refetch: fetchProducts,
		}),
		[products, loading, error, fetchProducts]
	);
};
