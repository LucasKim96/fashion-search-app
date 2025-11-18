"use client";

import { useState, useCallback } from "react";
import * as ProductVariantApi from "./productVariant.api";
import {
    ProductVariant,
    VariantGeneratedItem,
    ProductAttributeWithValues,
    UpdateProductVariantRequest,
} from "./productVariant.types";
import { ApiResponse } from "@shared/types/common.types";
import { useNotification, errorUtils } from "@shared/core";

// Import reloadShopProducts trực tiếp
import { useProduct } from "../product/product.hook";

export const useProductVariant = () => {
    const { showToast } = useNotification();
    const { getShopProducts: reloadShopProducts } = useProduct();

    // ====================== PUBLIC ======================
    const [publicAttributes, setPublicAttributes] = useState<ProductAttributeWithValues[] | null>(null);
    const [loadingPublicAttributes, setLoadingPublicAttributes] = useState(false);
    const [errorPublicAttributes, setErrorPublicAttributes] = useState<string | null>(null);

    const [generatedVariants, setGeneratedVariants] = useState<VariantGeneratedItem[] | null>(null);
    const [loadingGeneratedVariants, setLoadingGeneratedVariants] = useState(false);
    const [errorGeneratedVariants, setErrorGeneratedVariants] = useState<string | null>(null);

    // ====================== SHOP ======================
    const [createdVariants, setCreatedVariants] = useState<ProductVariant[] | null>(null);
    const [loadingCreatedVariants, setLoadingCreatedVariants] = useState(false);
    const [errorCreatedVariants, setErrorCreatedVariants] = useState<string | null>(null);

    const [updatedVariant, setUpdatedVariant] = useState<ProductVariant | null>(null);
    const [loadingUpdatedVariant, setLoadingUpdatedVariant] = useState(false);
    const [errorUpdatedVariant, setErrorUpdatedVariant] = useState<string | null>(null);

    // ====================== PUBLIC ACTIONS ======================
    const getProductAttributesWithValues = useCallback(
        async (productId: string): Promise<ApiResponse<ProductAttributeWithValues[]>> => {
            setLoadingPublicAttributes(true);
            setErrorPublicAttributes(null);
            try {
                const res = await ProductVariantApi.getProductAttributesWithValues(productId);
                if (res.success) setPublicAttributes(res.data);
                else setErrorPublicAttributes(res.message || "Lỗi API");
                return res;
            } catch (err) {
                const msg = errorUtils.parseApiError(err);
                setErrorPublicAttributes(msg);
                showToast(msg, "error");
                return { success: false, message: msg, data: null };
            } finally {
                setLoadingPublicAttributes(false);
            }
        },
        [showToast]
    );

    const generateVariantCombinations = useCallback(
        async (
            payload: Parameters<typeof ProductVariantApi.generateVariantCombinations>[0]
        ): Promise<ApiResponse<VariantGeneratedItem[]>> => {
            setLoadingGeneratedVariants(true);
            setErrorGeneratedVariants(null);
            try {
                const res = await ProductVariantApi.generateVariantCombinations(payload);
                if (res.success) setGeneratedVariants(res.data);
                else setErrorGeneratedVariants(res.message || "Lỗi API");
                return res;
            } catch (err) {
                const msg = errorUtils.parseApiError(err);
                setErrorGeneratedVariants(msg);
                showToast(msg, "error");
                return { success: false, message: msg, data: null };
            } finally {
                setLoadingGeneratedVariants(false);
            }
        },
        [showToast]
    );

    const generateNewVariantCombinations = useCallback(
        async (
            payload: Parameters<typeof ProductVariantApi.generateNewVariantCombinations>[0]
        ): Promise<ApiResponse<VariantGeneratedItem[]>> => {
            setLoadingGeneratedVariants(true);
            setErrorGeneratedVariants(null);
            try {
                const res = await ProductVariantApi.generateNewVariantCombinations(payload);
                if (res.success) setGeneratedVariants(res.data);
                else setErrorGeneratedVariants(res.message || "Lỗi API");
                return res;
            } catch (err) {
                const msg = errorUtils.parseApiError(err);
                setErrorGeneratedVariants(msg);
                showToast(msg, "error");
                return { success: false, message: msg, data: null };
            } finally {
                setLoadingGeneratedVariants(false);
            }
        },
        [showToast]
    );

    // ====================== SHOP ACTIONS ======================
    const bulkCreateProductVariants = useCallback(
        async (formData: FormData): Promise<ApiResponse<ProductVariant[]>> => {
            setLoadingCreatedVariants(true);
            setErrorCreatedVariants(null);
            try {
                const res = await ProductVariantApi.bulkCreateProductVariants(formData);
                if (res.success) {
                    setCreatedVariants(res.data);
                    showToast(res.message || "Tạo variant thành công", "success");
                    await reloadShopProducts();
                } else {
                    showToast(res.message || "Lỗi API", "error");
                }
                return res;
            } catch (err) {
                const msg = errorUtils.parseApiError(err);
                setErrorCreatedVariants(msg);
                showToast(msg, "error");
                return { success: false, message: msg, data: null };
            } finally {
                setLoadingCreatedVariants(false);
            }
        },
        [showToast, reloadShopProducts]
    );

    const updateProductVariant = useCallback(
        async (
            variantId: string,
            payload: UpdateProductVariantRequest | FormData
        ): Promise<ApiResponse<ProductVariant>> => {
            setLoadingUpdatedVariant(true);
            setErrorUpdatedVariant(null);
            try {
                const res = await ProductVariantApi.updateProductVariant(variantId, payload);
                if (res.success) {
                    setUpdatedVariant(res.data);
                    showToast(res.message || "Cập nhật variant thành công", "success");
                    await reloadShopProducts();
                } else {
                    showToast(res.message || "Lỗi API", "error");
                }
                return res;
            } catch (err) {
                const msg = errorUtils.parseApiError(err);
                setErrorUpdatedVariant(msg);
                showToast(msg, "error");
                return { success: false, message: msg, data: null };
            } finally {
                setLoadingUpdatedVariant(false);
            }
        },
        [showToast, reloadShopProducts]
    );

    return {
        // ====== STATES ======
        publicVariantState: { data: publicAttributes, loading: loadingPublicAttributes, error: errorPublicAttributes },
        generatedVariantsState: { data: generatedVariants, loading: loadingGeneratedVariants, error: errorGeneratedVariants },
        createdVariantsState: { data: createdVariants, loading: loadingCreatedVariants, error: errorCreatedVariants },
        updatedVariantState: { data: updatedVariant, loading: loadingUpdatedVariant, error: errorUpdatedVariant },

        // ====== ACTIONS ======
        getProductAttributesWithValues,
        generateVariantCombinations,
        generateNewVariantCombinations,
        bulkCreateProductVariants,
        updateProductVariant,
    };
};


// "use client";

// import { useState, useCallback, useMemo } from "react";
// import * as ProductVariantApi from "./productVariant.api";
// import {
//     ProductVariant,
//     VariantGeneratedItem,
//     ProductAttributeWithValues,
//     UpdateProductVariantRequest,
// } from "./productVariant.types";
// import { ApiResponse } from "@shared/types/common.types";
// import { useNotification, errorUtils } from "@shared/core";

// /**
//  * Hook quản lý ProductVariant giống pattern useAttribute
//  */
// export const useProductVariant = () => {
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
//     const publicVariantState = createApiState<ProductAttributeWithValues[]>();
//     const generatedVariantsState = createApiState<VariantGeneratedItem[]>();
//     const createdVariantsState = createApiState<ProductVariant[]>();
//     const updatedVariantState = createApiState<ProductVariant>();

//     // ===== Helper: run API + refresh =====
//     const runAndRefresh = useCallback(
//         async <T,>(apiCall: () => Promise<ApiResponse<T>>, refreshFn?: () => void) => {
//             const res = await apiCall();
//             if (res.success && refreshFn) await refreshFn();
//             return res;
//         },
//         []
//     );

//     // ===== Public API Actions =====
//     const getProductAttributesWithValues = useCallback(
//         (productId: string) =>
//             publicVariantState.run(() =>
//                 ProductVariantApi.getProductAttributesWithValues(productId)
//             ),
//         [publicVariantState]
//     );

//     const generateVariantCombinations = useCallback(
//         (payload: Parameters<typeof ProductVariantApi.generateVariantCombinations>[0]) =>
//             generatedVariantsState.run(() =>
//                 ProductVariantApi.generateVariantCombinations(payload)
//             ),
//         [generatedVariantsState]
//     );

//     const generateNewVariantCombinations = useCallback(
//         (payload: Parameters<typeof ProductVariantApi.generateNewVariantCombinations>[0]) =>
//             generatedVariantsState.run(() =>
//                 ProductVariantApi.generateNewVariantCombinations(payload)
//             ),
//         [generatedVariantsState]
//     );

//     // ===== Admin / Shop API Actions =====
//     const bulkCreateProductVariants = useCallback(
//         (formData: FormData, refreshFn?: () => void) =>
//             createdVariantsState.run(
//                 () => runAndRefresh(() => ProductVariantApi.bulkCreateProductVariants(formData), refreshFn),
//                 { showToastOnSuccess: true }
//             ),
//         [createdVariantsState, runAndRefresh]
//     );

//     const updateProductVariant = useCallback(
//         (variantId: string, payload: UpdateProductVariantRequest | FormData, refreshFn?: () => void) =>
//             updatedVariantState.run(
//                 () => runAndRefresh(() => ProductVariantApi.updateProductVariant(variantId, payload), refreshFn),
//                 { showToastOnSuccess: true }
//             ),
//         [updatedVariantState, runAndRefresh]
//     );

//     return {
//         // states
//         publicVariantState,
//         generatedVariantsState,
//         createdVariantsState,
//         updatedVariantState,

//         // helper
//         runAndRefresh,

//         // actions
//         getProductAttributesWithValues,
//         generateVariantCombinations,
//         generateNewVariantCombinations,
//         bulkCreateProductVariants,
//         updateProductVariant,
//     };
// };
