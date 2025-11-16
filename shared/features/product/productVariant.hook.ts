"use client";

import { useState, useCallback, useMemo } from "react";
import * as ProductVariantApi from "./productVariant.api";
import {
    ProductVariant,
    VariantGeneratedItem,
    ProductAttributeWithValues,
    UpdateProductVariantRequest,
} from "./productVariant.types";
import { ApiResponse } from "@shared/types/common.types";
import { useNotification, errorUtils } from "@shared/core";

/**
 * Hook quản lý ProductVariant giống pattern useAttribute
 */
export const useProductVariant = () => {
    const { showToast } = useNotification();

    // ===== Generic API state =====
    const createApiState = <T,>() => {
        const [data, setData] = useState<T | null>(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        const run = useCallback(
            async (
                apiCall: () => Promise<ApiResponse<T>>,
                options?: { showToastOnSuccess?: boolean }
            ): Promise<ApiResponse<T>> => {
                setLoading(true);
                setError(null);
                try {
                    const res = await apiCall();
                    if (!res.success) {
                        const msg = res.message || "Lỗi API";
                        setError(msg);
                        showToast(msg, "error");
                    } else {
                        setData(res.data);
                        if (options?.showToastOnSuccess) {
                            showToast(res.message || "Thành công", "success");
                        }
                    }
                    return res;
                } catch (err) {
                    const msg = errorUtils.parseApiError(err);
                    setError(msg);
                    showToast(msg, "error");
                    return { success: false, message: msg, data: null };
                } finally {
                    setLoading(false);
                }
            },
            [showToast]
        );

        return useMemo(() => ({ data, loading, error, run, setData }), [data, loading, error, run]);
    };

    // ===== States =====
    const publicVariantState = createApiState<ProductAttributeWithValues[]>();
    const generatedVariantsState = createApiState<VariantGeneratedItem[]>();
    const createdVariantsState = createApiState<ProductVariant[]>();
    const updatedVariantState = createApiState<ProductVariant>();

    // ===== Helper: run API + refresh =====
    const runAndRefresh = useCallback(
        async <T,>(apiCall: () => Promise<ApiResponse<T>>, refreshFn?: () => void) => {
            const res = await apiCall();
            if (res.success && refreshFn) await refreshFn();
            return res;
        },
        []
    );

    // ===== Public API Actions =====
    const getProductAttributesWithValues = useCallback(
        (productId: string) =>
            publicVariantState.run(() =>
                ProductVariantApi.getProductAttributesWithValues(productId)
            ),
        [publicVariantState]
    );

    const generateVariantCombinations = useCallback(
        (payload: Parameters<typeof ProductVariantApi.generateVariantCombinations>[0]) =>
            generatedVariantsState.run(() =>
                ProductVariantApi.generateVariantCombinations(payload)
            ),
        [generatedVariantsState]
    );

    const generateNewVariantCombinations = useCallback(
        (payload: Parameters<typeof ProductVariantApi.generateNewVariantCombinations>[0]) =>
            generatedVariantsState.run(() =>
                ProductVariantApi.generateNewVariantCombinations(payload)
            ),
        [generatedVariantsState]
    );

    // ===== Admin / Shop API Actions =====
    const bulkCreateProductVariants = useCallback(
        (formData: FormData, refreshFn?: () => void) =>
            createdVariantsState.run(
                () => runAndRefresh(() => ProductVariantApi.bulkCreateProductVariants(formData), refreshFn),
                { showToastOnSuccess: true }
            ),
        [createdVariantsState, runAndRefresh]
    );

    const updateProductVariant = useCallback(
        (variantId: string, payload: UpdateProductVariantRequest | FormData, refreshFn?: () => void) =>
            updatedVariantState.run(
                () => runAndRefresh(() => ProductVariantApi.updateProductVariant(variantId, payload), refreshFn),
                { showToastOnSuccess: true }
            ),
        [updatedVariantState, runAndRefresh]
    );

    return {
        // states
        publicVariantState,
        generatedVariantsState,
        createdVariantsState,
        updatedVariantState,

        // helper
        runAndRefresh,

        // actions
        getProductAttributesWithValues,
        generateVariantCombinations,
        generateNewVariantCombinations,
        bulkCreateProductVariants,
        updateProductVariant,
    };
};
