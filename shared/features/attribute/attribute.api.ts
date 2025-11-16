// shared/features/attribute/attribute.api.ts
import { axiosInstance, ATTRIBUTE_ENDPOINTS } from "@shared/core";
import { ApiResponse } from "@shared/types/common.types";
import {
    AttributeWithValues,
    UpdateAttributeLabelRequest,
    GetAttributesFlexibleParams,
    FlexibleAttributesData,
} from "./attribute.types";

// ========================= PUBLIC API =========================
export const getAttributeById = async (id: string): Promise<ApiResponse<AttributeWithValues>> => {
    const res = await axiosInstance.get<ApiResponse<AttributeWithValues>>(ATTRIBUTE_ENDPOINTS.PUBLIC_BY_ID(id));
    return res.data;
};

export const deleteAttribute = async (id: string): Promise<ApiResponse> => {
    const res = await axiosInstance.delete<ApiResponse>(ATTRIBUTE_ENDPOINTS.PUBLIC_DELETE(id));
    return res.data;
};

export const toggleAttributeStatus = async (id: string): Promise<ApiResponse> => {
    const res = await axiosInstance.patch<ApiResponse>(ATTRIBUTE_ENDPOINTS.PUBLIC_TOGGLE(id));
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
