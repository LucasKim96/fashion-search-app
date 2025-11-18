"use client";

import { useState, useCallback, useMemo } from "react";
import * as ProductApi from "./product.api";
import {
    Product,
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

    const [productDetail, setProductDetail] = useState<Product | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [errorDetail, setErrorDetail] = useState<string | null>(null);

    const getPublicProducts = useCallback(async (): Promise<ApiResponse<Product[]>> => {
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
        async (productId: string): Promise<ApiResponse<Product>> => {
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

    const getAllProductsAdmin = useCallback(async (): Promise<ApiResponse<Product[]>> => {
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
    const fetchAdminCount = useCallback(async (includeInactive: boolean = true) => {
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
    }, [showToast]);

    const deleteProductAdmin = useCallback(
        async (productId: string): Promise<ApiResponse<null>> => {
        try {
            const res = await ProductApi.deleteProductAdmin(productId);
            if (res.success) {
            showToast(res.message || "Xóa sản phẩm thành công", "success");
            await getAllProductsAdmin();
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
            await getAllProductsAdmin();
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

    const [createdShopProduct, setCreatedShopProduct] = useState<Product | null>(null);
    const [updatedShopProduct, setUpdatedShopProduct] = useState<Product | null>(null);
    const [shopCount, setShopCount] = useState<number>(0);

    const getShopProducts = useCallback(async (): Promise<ApiResponse<Product[]>> => {
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

    const fetchShopCount = useCallback(async (includeInactive: boolean = true) => {
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
    }, [showToast]);

    const createShopProduct = useCallback(
        async (formData: FormData): Promise<ApiResponse<Product>> => {
        try {
            const res = await ProductApi.createShopProduct(formData);
            if (res.success) {
            setCreatedShopProduct(res.data);
            showToast(res.message || "Tạo sản phẩm thành công", "success");
            await getShopProducts();
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
        async (productId: string, payload: UpdateProductBasicInfoRequest): Promise<ApiResponse<Product>> => {
        try {
            const res = await ProductApi.updateShopProductBasic(productId, payload);
            if (res.success) {
            setUpdatedShopProduct(res.data);
            showToast(res.message || "Cập nhật thông tin thành công", "success");
            await getShopProducts();
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
        async (productId: string, formData: FormData): Promise<ApiResponse<Product>> => {
        try {
            const res = await ProductApi.updateShopProductImages(productId, formData);
            if (res.success) {
            setUpdatedShopProduct(res.data);
            showToast(res.message || "Cập nhật hình ảnh thành công", "success");
            await getShopProducts();
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
            showToast(res.message || "Cập nhật trạng thái sản phẩm thành công", "success");
            await getShopProducts();
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
            await getShopProducts();
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
        publicProductsState: { data: publicProducts, loading: loadingPublic, error: errorPublic },
        productsDetailState: { data: productDetail, loading: loadingDetail, error: errorDetail },
        adminProductsState: { data: adminProducts, loading: loadingAdmin, error: errorAdmin },
        shopProductsState: { data: shopProducts, loading: loadingShop, error: errorShop },
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

// export const useProduct = () => {
//     const { showToast } = useNotification();

//     // ===== Generic API state =====
//     const createApiState = <T,>() => {
//         const [data, setData] = useState<T | null>(null);
//         const [loading, setLoading] = useState(false);
//         const [error, setError] = useState<string | null>(null);

//         const run = useCallback(
//             async (
//                 apiCall: () => Promise<ApiResponse<T>>,
//                 options?: { showToastOnSuccess?: boolean }
//             ): Promise<ApiResponse<T>> => {
//                 setLoading(true);
//                 setError(null);
//                 try {
//                     const res = await apiCall();
//                     if (!res.success) {
//                         const msg = res.message || "Lỗi API";
//                         setError(msg);
//                         showToast(msg, "error");
//                     } else {
//                         setData(res.data);
//                         if (options?.showToastOnSuccess) {
//                             showToast(res.message || "Thành công", "success");
//                         }
//                     }
//                     return res;
//                 } catch (err) {
//                     const msg = errorUtils.parseApiError(err);
//                     setError(msg);
//                     showToast(msg, "error");
//                     return { success: false, message: msg, data: null };
//                 } finally {
//                     setLoading(false);
//                 }
//             },
//             [showToast]
//         );

//         return useMemo(() => ({ data, loading, error, run, setData }), [data, loading, error, run]);
//     };

//     // ===== States =====
//     const publicProductsState = createApiState<Product[]>();
//     const productsDetailState = createApiState<Product>();
//     const adminProductsState = createApiState<Product[]>();
//     const shopProductsState = createApiState<Product[]>();
//     const createdShopProductState = createApiState<Product>();
//     const updatedShopProductState = createApiState<Product>();
//     const deleteProductAdminState = createApiState<null>();
//     const toggleProductActiveState = createApiState<Product>();
//     const deleteShopProductState = createApiState<null>();
//     const toggleShopProductState = createApiState<Product>();

//     // ===== Helper =====
//     const runAndRefresh = useCallback(
//         async <T,>(apiCall: () => Promise<ApiResponse<T>>, refreshFn?: () => void) => {
//             const res = await apiCall();
//             if (res.success && refreshFn) await refreshFn();
//             return res;
//         },
//         []
//     );

//     // ================= Public =================
//     const { run: runPublicProducts } = publicProductsState;
//     const { run: runProductsDetail } = productsDetailState;

//     const getPublicProducts = useCallback(
//         () => runPublicProducts(() => ProductApi.getPublicProducts()),
//         [runPublicProducts]
//     );

//     const getPublicProductsByShop = useCallback(
//         (shopId: string) => runPublicProducts(() => ProductApi.getPublicProductsByShop(shopId)),
//         [runPublicProducts]
//     );

//     const getProductDetail = useCallback(
//         (productId: string) => runProductsDetail(() => ProductApi.getProductDetail(productId)),
//         [runProductsDetail]
//     );

//     // ================= Admin =================
//     const { run: runAdminProducts } = adminProductsState;
//     const { run: runDeleteProductAdmin } = deleteProductAdminState;
//     const { run: runToggleProductActive } = toggleProductActiveState;

//     const getAllProductsAdmin = useCallback(
//         () => runAdminProducts(() => ProductApi.getAllProductsAdmin()),
//         [runAdminProducts]
//     );

//     const deleteProductAdmin = useCallback(
//         (productId: string, refreshFn?: () => void) =>
//             runDeleteProductAdmin(() => runAndRefresh(() => ProductApi.deleteProductAdmin(productId), refreshFn), {
//                 showToastOnSuccess: true,
//             }),
//         [runDeleteProductAdmin, runAndRefresh]
//     );

//     const toggleProductActive = useCallback(
//         (productId: string, refreshFn?: () => void) =>
//             runToggleProductActive(() => runAndRefresh(() => ProductApi.toggleProductActive(productId), refreshFn), {
//                 showToastOnSuccess: true,
//             }),
//         [runToggleProductActive, runAndRefresh]
//     );

//     // ================= Shop =================
//     const { run: runShopProducts } = shopProductsState;
//     const { run: runCreatedShop } = createdShopProductState;
//     const { run: runUpdatedShop } = updatedShopProductState;
//     const { run: runDeleteShop } = deleteShopProductState;
//     const { run: runToggleShop } = toggleShopProductState;

//     const getShopProducts = useCallback(() => runShopProducts(() => ProductApi.getShopProducts()), [runShopProducts]);

//     const createShopProduct = useCallback(
//         (formData: FormData, refreshFn?: () => void) =>
//             runCreatedShop(() => runAndRefresh(() => ProductApi.createShopProduct(formData), refreshFn), {
//                 showToastOnSuccess: true,
//             }),
//         [runCreatedShop, runAndRefresh]
//     );

//     const updateShopProductBasic = useCallback(
//         (productId: string, payload: UpdateProductBasicInfoRequest, refreshFn?: () => void) =>
//             runUpdatedShop(
//                 () => runAndRefresh(() => ProductApi.updateShopProductBasic(productId, payload), refreshFn),
//                 { showToastOnSuccess: true }
//             ),
//         [runUpdatedShop, runAndRefresh]
//     );

//     const updateShopProductImages = useCallback(
//         (productId: string, formData: FormData, refreshFn?: () => void) =>
//             runUpdatedShop(
//                 () => runAndRefresh(() => ProductApi.updateShopProductImages(productId, formData), refreshFn),
//                 { showToastOnSuccess: true }
//             ),
//         [runUpdatedShop, runAndRefresh]
//     );

//     const toggleShopProduct = useCallback(
//         (productId: string, refreshFn?: () => void) =>
//             runToggleShop(() => runAndRefresh(() => ProductApi.toggleShopProduct(productId), refreshFn), {
//                 showToastOnSuccess: true,
//             }),
//         [runToggleShop, runAndRefresh]
//     );

//     const deleteShopProduct = useCallback(
//         (productId: string, refreshFn?: () => void) =>
//             runDeleteShop(() => runAndRefresh(() => ProductApi.deleteShopProduct(productId), refreshFn), {
//                 showToastOnSuccess: true,
//             }),
//         [runDeleteShop, runAndRefresh]
//     );

//     return {
//         // states
//         publicProductsState,
//         productsDetailState,
//         adminProductsState,
//         shopProductsState,
//         createdShopProductState,
//         updatedShopProductState,
//         deleteProductAdminState,
//         toggleProductActiveState,
//         deleteShopProductState,
//         toggleShopProductState,

//         // actions
//         getPublicProducts,
//         getPublicProductsByShop,
//         getProductDetail,
//         getAllProductsAdmin,
//         deleteProductAdmin,
//         toggleProductActive,
//         getShopProducts,
//         createShopProduct,
//         updateShopProductBasic,
//         updateShopProductImages,
//         toggleShopProduct,
//         deleteShopProduct,
//     };
// };
