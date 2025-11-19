"use client";

import { useState, useCallback } from "react";
import * as AttributeApi from "./attribute.api";
import {
    AttributeWithValues,
    FlexibleAttributesData,
    GetAttributesFlexibleParams,
    UpdateAttributeLabelRequest,
} from "./attribute.types";
import { ApiResponse } from "@shared/types/common.types";
import { useNotification, errorUtils } from "@shared/core";

export const useAttribute = () => {
    const { showToast } = useNotification();

    // ====== PUBLIC STATE ======
    const [publicAttribute, setPublicAttribute] = useState<AttributeWithValues | null>(null);
    const [loadingPublic, setLoadingPublic] = useState(false);
    const [errorPublic, setErrorPublic] = useState<string | null>(null);

    // ====== ADMIN STATE ======
    const [adminAttributes, setAdminAttributes] = useState<FlexibleAttributesData | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);
    const [errorAdmin, setErrorAdmin] = useState<string | null>(null);

    // ====== SHOP STATE ======
    const [shopAvailableAttributes, setShopAvailableAttributes] = useState<FlexibleAttributesData | null>(null);
    const [loadingShopAvailable, setLoadingShopAvailable] = useState(false);
    const [errorShopAvailable, setErrorShopAvailable] = useState<string | null>(null);
    const [shopAttributes, setShopAttributes] = useState<FlexibleAttributesData | null>(null);
    const [loadingShop, setLoadingShop] = useState(false);
    const [errorShop, setErrorShop] = useState<string | null>(null);

    // ================= PUBLIC ACTIONS =================
    const getAttributeById = useCallback(async (id: string) => {
        setLoadingPublic(true);
        setErrorPublic(null);
        try {
        const res = await AttributeApi.getAttributeById(id);
        if (res.success) {
            setPublicAttribute(res.data);
        } else {
            setErrorPublic(res.message || "Lỗi API");
            showToast(res.message || "Lỗi API", "error");
        }
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

    // ================= ADMIN ACTIONS =================
    const getAdminAttributes = useCallback(async (params?: GetAttributesFlexibleParams) => {
        setLoadingAdmin(true);
        setErrorAdmin(null);
        try {
        const res = await AttributeApi.getAdminAttributes(params);
        if (res.success) setAdminAttributes(res.data);
        else {
            setErrorAdmin(res.message || "Lỗi API");
            showToast(res.message || "Lỗi API", "error");
        }
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

    const searchAdminAttributes = useCallback(async (params: { query?: string; page?: number; limit?: number }) => {
        setLoadingAdmin(true);
        setErrorAdmin(null);
        try {
        const res = await AttributeApi.searchAdminAttributes({
            ...params,
            query: params.query?.trim() || undefined,
        });
        if (res.success) setAdminAttributes(res.data);
        else {
            setErrorAdmin(res.message || "Lỗi API");
            showToast(res.message || "Lỗi API", "error");
        }
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

    const reloadAdminAttributes = useCallback(async () => getAdminAttributes(), [getAdminAttributes]);

    const createAdminAttribute = useCallback(async (payload: FormData) => {
        try {
        const res = await AttributeApi.createAdminAttribute(payload);
        if (res.success) {
            //await reloadShopProducts();
            showToast(res.message || "Tạo attribute thành công", "success");
        } else {
            showToast(res.message || "Lỗi API", "error");
        }
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadAdminAttributes, showToast]);

    const updateAdminAttributeLabel = useCallback(async (id: string, payload: UpdateAttributeLabelRequest) => {
        try {
        const res = await AttributeApi.updateAdminAttributeLabel(id, payload);
        if (res.success) {
            //await reloadShopProducts();
            showToast(res.message || "Cập nhật label thành công", "success");
        } else {
            showToast(res.message || "Lỗi API", "error");
        }
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadAdminAttributes, showToast]);

    const hideAdminAttribute = useCallback(async (id: string) => {
        try {
        const res = await AttributeApi.toggleAdminAttributeStatus(id);
        if (res.success) {
            //await reloadShopProducts();
            showToast(res.message || "Ẩn/hiện attribute thành công", "success");
        } else {
            showToast(res.message || "Lỗi API", "error");
        }
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadAdminAttributes, showToast]);

    const deleteAdminAttribute = useCallback(async (id: string) => {
        try {
        const res = await AttributeApi.deleteAdminAttribute(id);
        if (res.success) {
            //await reloadShopProducts();
            showToast(res.message || "Xóa attribute thành công", "success");
        } else {
            showToast(res.message || "Lỗi API", "error");
        }
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadAdminAttributes, showToast]);

    // ================= SHOP ACTIONS =================

    const getShopAvailableAttributes = useCallback(
        async (params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: "asc" | "desc" }) => {
            setLoadingShopAvailable(true);
            setErrorShopAvailable(null);
            try {
            const res = await AttributeApi.getShopAvailableAttributes(params);
            if (res.success) setShopAvailableAttributes(res.data);
            else {
                setErrorShopAvailable(res.message || "Lỗi API");
                showToast(res.message || "Lỗi API", "error");
            }
            return res;
            } catch (err) {
            const msg = errorUtils.parseApiError(err);
            setErrorShopAvailable(msg);
            showToast(msg, "error");
            return { success: false, message: msg, data: null };
            } finally {
            setLoadingShopAvailable(false);
            }
        },
        [showToast]
    );

    const getShopAvailableAttributeById = useCallback(
    async (id: string) => {
            setLoadingShopAvailable(true);
            setErrorShopAvailable(null);
            try {
            const res = await AttributeApi.getShopAvailableAttributeById(id);
            if (res.success) {
                // Khi lấy chi tiết attribute, có thể set state nếu muốn
                // setShopAvailableAttributes({ attributes: [res.data], total: 1, page: 1, limit: 1, totalPages: 1 });
            } else {
                setErrorShopAvailable(res.message || "Lỗi API");
                showToast(res.message || "Lỗi API", "error");
            }
            return res;
            } catch (err) {
            const msg = errorUtils.parseApiError(err);
            setErrorShopAvailable(msg);
            showToast(msg, "error");
            return { success: false, message: msg, data: null };
            } finally {
            setLoadingShopAvailable(false);
            }
        },
        [showToast]
    );
    const getShopAttributes = useCallback(async (params?: GetAttributesFlexibleParams) => {
        setLoadingShop(true);
        setErrorShop(null);
        try {
        const res = await AttributeApi.getShopAttributes(params);
        if (res.success) setShopAttributes(res.data);
        else {
            setErrorShop(res.message || "Lỗi API");
            showToast(res.message || "Lỗi API", "error");
        }
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

    const searchShopAttributes = useCallback(async (params: { query?: string; page?: number; limit?: number }) => {
        setLoadingShop(true);
        setErrorShop(null);
        try {
        const res = await AttributeApi.searchShopAttributes({
            ...params,
            query: params.query?.trim() || undefined,
        });
        if (res.success) setShopAttributes(res.data);
        else {
            setErrorShop(res.message || "Lỗi API");
            showToast(res.message || "Lỗi API", "error");
        }
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

    const reloadShopAttributes = useCallback(() => getShopAttributes(), [getShopAttributes]);

    const createShopAttribute = useCallback(async (payload: FormData) => {
        try {
        const res = await AttributeApi.createShopAttribute(payload);
        if (res.success) {
            await reloadShopAttributes();
            showToast(res.message || "Tạo attribute thành công", "success");
        } else showToast(res.message || "Lỗi API", "error");
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadShopAttributes, showToast]);

    const updateShopAttributeLabel = useCallback(async (id: string, payload: UpdateAttributeLabelRequest) => {
        try {
        const res = await AttributeApi.updateShopAttributeLabel(id, payload);
        if (res.success) {
            await reloadShopAttributes();
            showToast(res.message || "Cập nhật label thành công", "success");
        } else showToast(res.message || "Lỗi API", "error");
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadShopAttributes, showToast]);

    const hideShopAttribute = useCallback(async (id: string) => {
        try {
        const res = await AttributeApi.toggleShopAttributeStatus(id);
        if (res.success) {
            await reloadShopAttributes();
            showToast(res.message || "Ẩn/hiện attribute thành công", "success");
        } else showToast(res.message || "Lỗi API", "error");
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadShopAttributes, showToast]);

    const deleteShopAttribute = useCallback(async (id: string) => {
        try {
        const res = await AttributeApi.deleteShopAttribute(id);
        if (res.success) {
            await reloadShopAttributes();
            showToast(res.message || "Xóa attribute thành công", "success");
        } else showToast(res.message || "Lỗi API", "error");
        return res;
        } catch (err) {
        const msg = errorUtils.parseApiError(err);
        showToast(msg, "error");
        return { success: false, message: msg, data: null };
        }
    }, [reloadShopAttributes, showToast]);

    return {
        // States
        publicAttribute,
        loadingPublic,
        errorPublic,

        adminAttributes,
        loadingAdmin,
        errorAdmin,

        shopAvailableAttributes,
        loadingShopAvailable,
        errorShopAvailable,
        shopAttributes,
        loadingShop,
        errorShop,

        // Actions
        getAttributeById,
        getAdminAttributes,
        searchAdminAttributes,
        createAdminAttribute,
        updateAdminAttributeLabel,
        hideAdminAttribute,
        deleteAdminAttribute,

        getShopAvailableAttributes,
        getShopAvailableAttributeById,
        getShopAttributes,
        searchShopAttributes,
        createShopAttribute,
        updateShopAttributeLabel,
        hideShopAttribute,
        deleteShopAttribute,
        reloadAdminAttributes,
        reloadShopAttributes,
    };
};
