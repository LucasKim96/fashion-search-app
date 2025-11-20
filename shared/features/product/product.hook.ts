"use client";

import { useState, useCallback, useMemo } from "react";
import * as ProductApi from "./product.api";
import {
	Product,
	ProductDetail,
	CreateProductWithVariantsRequest,
	UpdateProductBasicInfoRequest,
	UpdateProductImagesRequest,
	ProductSearchRequest,
} from "./product.types";
import { ApiResponse } from "@shared/types/common.types";
import { useNotification, errorUtils } from "@shared/core";

export const useProduct = () => {
	const { showToast } = useNotification();

	// ====================== PUBLIC ======================
	const [publicProducts, setPublicProducts] = useState<Product[] | null>(null);
	const [loadingPublic, setLoadingPublic] = useState(false);
	const [errorPublic, setErrorPublic] = useState<string | null>(null);

	const [productDetail, setProductDetail] = useState<ProductDetail | null>(
		null
	);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const [errorDetail, setErrorDetail] = useState<string | null>(null);

	const getPublicProducts = useCallback(async (): Promise<
		ApiResponse<Product[]>
	> => {
		setLoadingPublic(true);
		setErrorPublic(null);
		try {
			const res = await ProductApi.getPublicProducts();
			if (res.success) setPublicProducts(res.data);
			else setErrorPublic(res.message || "Lỗi API");
			return res;
		} catch (err) {
			const msg = errorUtils.parseApiError(err);
			setErrorPublic(msg);
			showToast(msg, "error");
			return { success: false, message: msg, data: null };
		} finally {
			setLoadingPublic(false);
		}
	}, [showToast]);

	const getPublicProductsByShop = useCallback(
		async (shopId: string): Promise<ApiResponse<Product[]>> => {
			setLoadingPublic(true);
			setErrorPublic(null);
			try {
				const res = await ProductApi.getPublicProductsByShop(shopId);
				if (res.success) setPublicProducts(res.data);
				else setErrorPublic(res.message || "Lỗi API");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorPublic(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingPublic(false);
			}
		},
		[showToast]
	);

	const getProductDetail = useCallback(
		async (productId: string): Promise<ApiResponse<ProductDetail>> => {
			setLoadingDetail(true);
			setErrorDetail(null);
			try {
				const res = await ProductApi.getProductDetail(productId);
				if (res.success) setProductDetail(res.data);
				else setErrorDetail(res.message || "Lỗi API");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorDetail(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingDetail(false);
			}
		},
		[showToast]
	);

	// ====================== ADMIN ======================
	const [adminProducts, setAdminProducts] = useState<Product[] | null>(null);
	const [loadingAdmin, setLoadingAdmin] = useState(false);
	const [errorAdmin, setErrorAdmin] = useState<string | null>(null);
	const [adminCount, setAdminCount] = useState<number>(0);

	const getAllProductsAdmin = useCallback(async (): Promise<
		ApiResponse<Product[]>
	> => {
		setLoadingAdmin(true);
		setErrorAdmin(null);
		try {
			const res = await ProductApi.getAllProductsAdmin();
			if (res.success) setAdminProducts(res.data);
			else setErrorAdmin(res.message || "Lỗi API");
			return res;
		} catch (err) {
			const msg = errorUtils.parseApiError(err);
			setErrorAdmin(msg);
			showToast(msg, "error");
			return { success: false, message: msg, data: null };
		} finally {
			setLoadingAdmin(false);
		}
	}, [showToast]);

	// Search products admin
	const searchAdminProducts = useCallback(
		async (params?: ProductSearchRequest): Promise<ApiResponse<any>> => {
			setLoadingAdmin(true);
			setErrorAdmin(null);
			try {
				const res = await ProductApi.searchProductsAdmin(params);
				if (res.success) setAdminProducts(res.data?.products ?? []);
				else setErrorAdmin(res.message || "Lỗi API");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorAdmin(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingAdmin(false);
			}
		},
		[showToast]
	);

	// Count products admin
	const fetchAdminCount = useCallback(
		async (includeInactive: boolean = true) => {
			try {
				const res = await ProductApi.countAllProductsAdmin(includeInactive);
				if (res.success && res.data) {
					setAdminCount(res.data.total ?? 0); // res.data có thể null, dùng ?? 0
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				showToast(msg, "error");
				return { success: false, message: msg, data: { total: 0 } };
			}
		},
		[showToast]
	);

	const deleteProductAdmin = useCallback(
		async (productId: string): Promise<ApiResponse<null>> => {
			try {
				const res = await ProductApi.deleteProductAdmin(productId);
				if (res.success) {
					showToast(res.message || "Xóa sản phẩm thành công", "success");
				} else showToast(res.message || "Lỗi API", "error");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			}
		},
		[showToast, getAllProductsAdmin]
	);

	const toggleProductActive = useCallback(
		async (productId: string): Promise<ApiResponse<Product>> => {
			try {
				const res = await ProductApi.toggleProductActive(productId);
				if (res.success) {
					showToast(res.message || "Cập nhật trạng thái thành công", "success");
				} else showToast(res.message || "Lỗi API", "error");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			}
		},
		[showToast, getAllProductsAdmin]
	);

	// ====================== SHOP ======================
	const [shopProducts, setShopProducts] = useState<Product[] | null>(null);
	const [loadingShop, setLoadingShop] = useState(false);
	const [errorShop, setErrorShop] = useState<string | null>(null);

	const [createdShopProduct, setCreatedShopProduct] = useState<Product | null>(
		null
	);
	const [updatedShopProduct, setUpdatedShopProduct] = useState<Product | null>(
		null
	);
	const [shopCount, setShopCount] = useState<number>(0);

	const getShopProducts = useCallback(async (): Promise<
		ApiResponse<Product[]>
	> => {
		setLoadingShop(true);
		setErrorShop(null);
		try {
			const res = await ProductApi.getShopProducts();
			if (res.success) setShopProducts(res.data);
			else setErrorShop(res.message || "Lỗi API");
			return res;
		} catch (err) {
			const msg = errorUtils.parseApiError(err);
			setErrorShop(msg);
			showToast(msg, "error");
			return { success: false, message: msg, data: null };
		} finally {
			setLoadingShop(false);
		}
	}, [showToast]);

	// Search products shop
	const searchShopProducts = useCallback(
		async (params?: ProductSearchRequest): Promise<ApiResponse<any>> => {
			setLoadingShop(true);
			setErrorShop(null);
			try {
				const res = await ProductApi.searchProductsShop(params);
				if (res.success) setShopProducts(res.data?.products ?? []);
				else setErrorShop(res.message || "Lỗi API");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorShop(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingShop(false);
			}
		},
		[showToast]
	);

	const fetchShopCount = useCallback(
		async (includeInactive: boolean = true) => {
			try {
				const res = await ProductApi.countShopProducts(includeInactive);
				if (res.success && res.data) {
					setShopCount(res.data.total ?? 0);
				}
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				showToast(msg, "error");
				return { success: false, message: msg, data: { total: 0 } };
			}
		},
		[showToast]
	);

	const createShopProduct = useCallback(
		async (formData: FormData): Promise<ApiResponse<Product>> => {
			try {
				const res = await ProductApi.createShopProduct(formData);
				if (res.success) {
					setCreatedShopProduct(res.data);
					showToast(res.message || "Tạo sản phẩm thành công", "success");
				} else showToast(res.message || "Lỗi API", "error");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			}
		},
		[showToast, getShopProducts]
	);

	const updateShopProductBasic = useCallback(
		async (
			productId: string,
			payload: UpdateProductBasicInfoRequest
		): Promise<ApiResponse<Product>> => {
			try {
				const res = await ProductApi.updateShopProductBasic(productId, payload);
				if (res.success) {
					setUpdatedShopProduct(res.data);
					showToast(res.message || "Cập nhật thông tin thành công", "success");
				} else showToast(res.message || "Lỗi API", "error");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			}
		},
		[showToast, getShopProducts]
	);

	const updateShopProductImages = useCallback(
		async (
			productId: string,
			formData: FormData
		): Promise<ApiResponse<Product>> => {
			try {
				const res = await ProductApi.updateShopProductImages(
					productId,
					formData
				);
				if (res.success) {
					setUpdatedShopProduct(res.data);
					showToast(res.message || "Cập nhật hình ảnh thành công", "success");
				} else showToast(res.message || "Lỗi API", "error");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			}
		},
		[showToast, getShopProducts]
	);

	const toggleShopProduct = useCallback(
		async (productId: string): Promise<ApiResponse<Product>> => {
			try {
				const res = await ProductApi.toggleShopProduct(productId);
				if (res.success) {
					showToast(
						res.message || "Cập nhật trạng thái sản phẩm thành công",
						"success"
					);
				} else showToast(res.message || "Lỗi API", "error");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			}
		},
		[showToast, getShopProducts]
	);

	const deleteShopProduct = useCallback(
		async (productId: string): Promise<ApiResponse<null>> => {
			try {
				const res = await ProductApi.deleteShopProduct(productId);
				if (res.success) {
					showToast(res.message || "Xóa sản phẩm thành công", "success");
				} else showToast(res.message || "Lỗi API", "error");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			}
		},
		[showToast, getShopProducts]
	);

	return {
		// ====== STATES ======
		publicProductsState: {
			data: publicProducts,
			loading: loadingPublic,
			error: errorPublic,
		},
		productsDetailState: {
			data: productDetail,
			loading: loadingDetail,
			error: errorDetail,
		},
		adminProductsState: {
			data: adminProducts,
			loading: loadingAdmin,
			error: errorAdmin,
		},
		shopProductsState: {
			data: shopProducts,
			loading: loadingShop,
			error: errorShop,
		},
		createdShopProductState: { data: createdShopProduct },
		updatedShopProductState: { data: updatedShopProduct },
		adminCountState: { data: adminCount },
		shopCountState: { data: shopCount },

		// ====== PUBLIC ACTIONS ======
		getPublicProducts,
		getPublicProductsByShop,
		getProductDetail,

		// ====== ADMIN ACTIONS ======
		getAllProductsAdmin,
		deleteProductAdmin,
		toggleProductActive,
		searchAdminProducts,
		fetchAdminCount,

		// ====== SHOP ACTIONS ======
		getShopProducts,
		createShopProduct,
		updateShopProductBasic,
		updateShopProductImages,
		toggleShopProduct,
		deleteShopProduct,
		searchShopProducts,
		fetchShopCount,
	};
};
