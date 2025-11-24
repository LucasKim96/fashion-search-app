import { useState, useEffect, useCallback, useMemo } from "react";
import { getProductDetail } from "./product.api";
import { ProductDetail } from "./product.types";

export const useProductDetail = (productId: string) => {
	const [product, setProduct] = useState<ProductDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchProductDetail = useCallback(async () => {
		if (!productId) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const res = await getProductDetail(productId); // Sử dụng API đã có
			if (res.success && res.data) {
				setProduct(res.data);
			} else {
				setError(res.message || "Không thể tải chi tiết sản phẩm.");
			}
		} catch (err: any) {
			setError(err.message || "Đã có lỗi xảy ra.");
		} finally {
			setLoading(false);
		}
	}, [productId]);

	useEffect(() => {
		fetchProductDetail();
	}, [fetchProductDetail]);

	return useMemo(
		() => ({
			product,
			loading,
			error,
			refetch: fetchProductDetail,
		}),
		[product, loading, error, fetchProductDetail]
	);
};
