// shared/features/attribute/attribute.api.ts
import { axiosInstance, ATTRIBUTE_ENDPOINTS } from "@shared/core";
import { ApiResponse } from "@shared/types/common.types";
import {
    AttributeWithValues,
    UpdateAttributeLabelRequest,
    GetAttributesFlexibleParams,
    FlexibleAttributesData,
    Attribute,
} from "./attribute.types";

// ========================= PUBLIC API =========================
export const getAttributeById = async (id: string): Promise<ApiResponse<AttributeWithValues>> => {
    const res = await axiosInstance.get<ApiResponse<AttributeWithValues>>(ATTRIBUTE_ENDPOINTS.PUBLIC_BY_ID(id));
    return res.data;
};



// ========================= ADMIN API =========================
export const getAdminAttributes = async (params?: GetAttributesFlexibleParams): Promise<ApiResponse<FlexibleAttributesData>> => {
    const res = await axiosInstance.get<ApiResponse<FlexibleAttributesData>>(ATTRIBUTE_ENDPOINTS.ADMIN_LIST, { params });
    return res.data;
};

export const searchAdminAttributes = async (params: { query?: string; page?: number; limit?: number }): Promise<ApiResponse<FlexibleAttributesData>> => {
    const res = await axiosInstance.get<ApiResponse<FlexibleAttributesData>>(ATTRIBUTE_ENDPOINTS.ADMIN_SEARCH, { params });
    return res.data;
};

export const createAdminAttribute = async (payload: FormData): Promise<ApiResponse<AttributeWithValues>> => {
    const res = await axiosInstance.post<ApiResponse<AttributeWithValues>>(
        ATTRIBUTE_ENDPOINTS.ADMIN_CREATE,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
};

export const updateAdminAttributeLabel = async (id: string, payload: UpdateAttributeLabelRequest): Promise<ApiResponse<AttributeWithValues>> => {
    const res = await axiosInstance.put<ApiResponse<AttributeWithValues>>(ATTRIBUTE_ENDPOINTS.ADMIN_UPDATE_LABEL(id), payload);
    return res.data;
};

export const deleteAdminAttribute = async (id: string): Promise<ApiResponse> => {
    const res = await axiosInstance.delete<ApiResponse>(ATTRIBUTE_ENDPOINTS.ADMIN_DELETE(id));
    return res.data;
};

export const toggleAdminAttributeStatus = async (id: string): Promise<ApiResponse> => {
    const res = await axiosInstance.patch<ApiResponse>(ATTRIBUTE_ENDPOINTS.ADMIN_TOGGLE(id));
    return res.data;
};

// ========================= SHOP AVAILABLE API =========================

/**
 * Lấy danh sách attribute khả dụng của shop
 * @param params Pagination + sorting
 */
export const getShopAvailableAttributes = async (
    params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: "asc" | "desc" }
    ): Promise<ApiResponse<FlexibleAttributesData>> => {
    const res = await axiosInstance.get<ApiResponse<FlexibleAttributesData>>(
        ATTRIBUTE_ENDPOINTS.SHOP_AVAILABLE_LIST,
        { params }
    );
    return res.data;
    };

    /**
     * Lấy chi tiết attribute khả dụng theo id (kèm value khả dụng)
     * @param id AttributeId
     */
    export const getShopAvailableAttributeById = async (
    id: string
    ): Promise<ApiResponse<Attribute>> => {
    const res = await axiosInstance.get<ApiResponse<Attribute>>(
        ATTRIBUTE_ENDPOINTS.SHOP_AVAILABLE_BY_ID(id)
    );
    return res.data;
};

// ========================= SHOP API =========================
export const getShopAttributes = async (params?: GetAttributesFlexibleParams): Promise<ApiResponse<FlexibleAttributesData>> => {
    const res = await axiosInstance.get<ApiResponse<FlexibleAttributesData>>(ATTRIBUTE_ENDPOINTS.SHOP_LIST, { params });
    return res.data;
};

export const searchShopAttributes = async (params: { query?: string; page?: number; limit?: number }): Promise<ApiResponse<FlexibleAttributesData>> => {
    const res = await axiosInstance.get<ApiResponse<FlexibleAttributesData>>(ATTRIBUTE_ENDPOINTS.SHOP_SEARCH, { params });
    return res.data;
};

export const createShopAttribute = async (payload: FormData): Promise<ApiResponse<AttributeWithValues>> => {
    const res = await axiosInstance.post<ApiResponse<AttributeWithValues>>(
        ATTRIBUTE_ENDPOINTS.SHOP_CREATE,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
};

export const updateShopAttributeLabel = async (id: string, payload: UpdateAttributeLabelRequest): Promise<ApiResponse<AttributeWithValues>> => {
    const res = await axiosInstance.put<ApiResponse<AttributeWithValues>>(ATTRIBUTE_ENDPOINTS.SHOP_UPDATE_LABEL(id), payload);
    return res.data;
};

export const deleteShopAttribute = async (id: string): Promise<ApiResponse> => {
    const res = await axiosInstance.delete<ApiResponse>(ATTRIBUTE_ENDPOINTS.SHOP_DELETE(id));
    return res.data;
};

export const toggleShopAttributeStatus = async (id: string): Promise<ApiResponse> => {
    const res = await axiosInstance.patch<ApiResponse>(ATTRIBUTE_ENDPOINTS.SHOP_TOGGLE(id));
    return res.data;
};