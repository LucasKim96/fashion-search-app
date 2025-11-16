"use client";

import { useState, useCallback, useMemo } from "react";
import * as ProductApi from "./product.api";
import {
    Product,
    CreateProductWithVariantsRequest,
    UpdateProductBasicInfoRequest,
    UpdateProductImagesRequest,
} from "./product.types";
import { ApiResponse } from "@shared/types/common.types";
import { useNotification, errorUtils } from "@shared/core";

export const useProduct = () => {
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
    const publicProductsState = createApiState<Product[]>();
    const productsDetailState = createApiState<Product>();
    const adminProductsState = createApiState<Product[]>();
    const shopProductsState = createApiState<Product[]>();
    const createdShopProductState = createApiState<Product>();
    const updatedShopProductState = createApiState<Product>();
    const deleteProductAdminState = createApiState<null>();
    const toggleProductActiveState = createApiState<Product>();
    const deleteShopProductState = createApiState<null>();
    const toggleShopProductState = createApiState<Product>();

    // ===== Helper =====
    const runAndRefresh = useCallback(
        async <T,>(apiCall: () => Promise<ApiResponse<T>>, refreshFn?: () => void) => {
            const res = await apiCall();
            if (res.success && refreshFn) await refreshFn();
            return res;
        },
        []
    );

    // ================= Public =================
    const { run: runPublicProducts } = publicProductsState;
    const { run: runProductsDetail } = productsDetailState;

    const getPublicProducts = useCallback(
        () => runPublicProducts(() => ProductApi.getPublicProducts()),
        [runPublicProducts]
    );

    const getPublicProductsByShop = useCallback(
        (shopId: string) => runPublicProducts(() => ProductApi.getPublicProductsByShop(shopId)),
        [runPublicProducts]
    );

    const getProductDetail = useCallback(
        (productId: string) => runProductsDetail(() => ProductApi.getProductDetail(productId)),
        [runProductsDetail]
    );

    // ================= Admin =================
    const { run: runAdminProducts } = adminProductsState;
    const { run: runDeleteProductAdmin } = deleteProductAdminState;
    const { run: runToggleProductActive } = toggleProductActiveState;

    const getAllProductsAdmin = useCallback(
        () => runAdminProducts(() => ProductApi.getAllProductsAdmin()),
        [runAdminProducts]
    );

    const deleteProductAdmin = useCallback(
        (productId: string, refreshFn?: () => void) =>
            runDeleteProductAdmin(() => runAndRefresh(() => ProductApi.deleteProductAdmin(productId), refreshFn), {
                showToastOnSuccess: true,
            }),
        [runDeleteProductAdmin, runAndRefresh]
    );

    const toggleProductActive = useCallback(
        (productId: string, refreshFn?: () => void) =>
            runToggleProductActive(() => runAndRefresh(() => ProductApi.toggleProductActive(productId), refreshFn), {
                showToastOnSuccess: true,
            }),
        [runToggleProductActive, runAndRefresh]
    );

    // ================= Shop =================
    const { run: runShopProducts } = shopProductsState;
    const { run: runCreatedShop } = createdShopProductState;
    const { run: runUpdatedShop } = updatedShopProductState;
    const { run: runDeleteShop } = deleteShopProductState;
    const { run: runToggleShop } = toggleShopProductState;

    const getShopProducts = useCallback(() => runShopProducts(() => ProductApi.getShopProducts()), [runShopProducts]);

    const createShopProduct = useCallback(
        (formData: FormData, refreshFn?: () => void) =>
            runCreatedShop(() => runAndRefresh(() => ProductApi.createShopProduct(formData), refreshFn), {
                showToastOnSuccess: true,
            }),
        [runCreatedShop, runAndRefresh]
    );

    const updateShopProductBasic = useCallback(
        (productId: string, payload: UpdateProductBasicInfoRequest, refreshFn?: () => void) =>
            runUpdatedShop(
                () => runAndRefresh(() => ProductApi.updateShopProductBasic(productId, payload), refreshFn),
                { showToastOnSuccess: true }
            ),
        [runUpdatedShop, runAndRefresh]
    );

    const updateShopProductImages = useCallback(
        (productId: string, formData: FormData, refreshFn?: () => void) =>
            runUpdatedShop(
                () => runAndRefresh(() => ProductApi.updateShopProductImages(productId, formData), refreshFn),
                { showToastOnSuccess: true }
            ),
        [runUpdatedShop, runAndRefresh]
    );

    const toggleShopProduct = useCallback(
        (productId: string, refreshFn?: () => void) =>
            runToggleShop(() => runAndRefresh(() => ProductApi.toggleShopProduct(productId), refreshFn), {
                showToastOnSuccess: true,
            }),
        [runToggleShop, runAndRefresh]
    );

    const deleteShopProduct = useCallback(
        (productId: string, refreshFn?: () => void) =>
            runDeleteShop(() => runAndRefresh(() => ProductApi.deleteShopProduct(productId), refreshFn), {
                showToastOnSuccess: true,
            }),
        [runDeleteShop, runAndRefresh]
    );

    return {
        // states
        publicProductsState,
        productsDetailState,
        adminProductsState,
        shopProductsState,
        createdShopProductState,
        updatedShopProductState,
        deleteProductAdminState,
        toggleProductActiveState,
        deleteShopProductState,
        toggleShopProductState,

        // actions
        getPublicProducts,
        getPublicProductsByShop,
        getProductDetail,
        getAllProductsAdmin,
        deleteProductAdmin,
        toggleProductActive,
        getShopProducts,
        createShopProduct,
        updateShopProductBasic,
        updateShopProductImages,
        toggleShopProduct,
        deleteShopProduct,
    };
};
