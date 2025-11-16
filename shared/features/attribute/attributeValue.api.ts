// shared/features/attribute/attributeValue.api.ts
import { axiosInstance, ATTRIBUTE_VALUE_ENDPOINTS } from "@shared/core";
import { ApiResponse } from "@shared/types/common.types";
import {
    AttributeValue,
    UpdateAttributeValueRequest,
} from "./attributeValue.types";

// ========================= ADMIN API =========================
export const createAdminAttributeValues = async (
    attributeId: string,
    payload: FormData
    ): Promise<ApiResponse<AttributeValue[]>> => {
    const res = await axiosInstance.post<ApiResponse<AttributeValue[]>>(
        ATTRIBUTE_VALUE_ENDPOINTS.ADMIN_CREATE(attributeId),
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
};

export const updateAdminAttributeValue = async (
    valueId: string,
    payload: UpdateAttributeValueRequest | FormData
): Promise<ApiResponse<AttributeValue>> => {

    let res;

    if (payload instanceof FormData) {
        // TH: upload ảnh mới
        res = await axiosInstance.put<ApiResponse<AttributeValue>>(
            ATTRIBUTE_VALUE_ENDPOINTS.ADMIN_UPDATE(valueId),
            payload,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
    } else {
        // TH: đổi value hoặc xóa ảnh (image: "")
        res = await axiosInstance.put<ApiResponse<AttributeValue>>(
            ATTRIBUTE_VALUE_ENDPOINTS.ADMIN_UPDATE(valueId),
            payload
        );
    }

    return res.data;
};


export const toggleAdminAttributeValue = async (
    valueId: string
    ): Promise<ApiResponse> => {
    const res = await axiosInstance.patch<ApiResponse>(
        ATTRIBUTE_VALUE_ENDPOINTS.ADMIN_TOGGLE(valueId)
    );
    return res.data;
};

export const deleteAdminAttributeValue = async (
    valueId: string
    ): Promise<ApiResponse> => {
    const res = await axiosInstance.delete<ApiResponse>(
        ATTRIBUTE_VALUE_ENDPOINTS.ADMIN_DELETE(valueId)
    );
    return res.data;
};

// ========================= SHOP API =========================
export const createShopAttributeValues = async (
    attributeId: string,
    payload: FormData
    ): Promise<ApiResponse<AttributeValue[]>> => {
    const res = await axiosInstance.post<ApiResponse<AttributeValue[]>>(
        ATTRIBUTE_VALUE_ENDPOINTS.SHOP_CREATE(attributeId),
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
};

export const updateShopAttributeValue = async (
    valueId: string,
    payload: UpdateAttributeValueRequest | FormData
): Promise<ApiResponse<AttributeValue>> => {
    let res;
    if (payload instanceof FormData) {
        // upload ảnh mới
        res = await axiosInstance.put<ApiResponse<AttributeValue>>(
            ATTRIBUTE_VALUE_ENDPOINTS.SHOP_UPDATE(valueId),
            payload,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
    } else {
        // chỉ đổi value hoặc xóa ảnh
        res = await axiosInstance.put<ApiResponse<AttributeValue>>(
            ATTRIBUTE_VALUE_ENDPOINTS.SHOP_UPDATE(valueId),
            payload
        );
    }
    return res.data;
};


export const toggleShopAttributeValue = async (
    valueId: string
    ): Promise<ApiResponse> => {
    const res = await axiosInstance.patch<ApiResponse>(
        ATTRIBUTE_VALUE_ENDPOINTS.SHOP_TOGGLE(valueId)
    );
    return res.data;
};

export const deleteShopAttributeValue = async (
    valueId: string
    ): Promise<ApiResponse> => {
    const res = await axiosInstance.delete<ApiResponse>(
        ATTRIBUTE_VALUE_ENDPOINTS.SHOP_DELETE(valueId)
    );
    return res.data;
};
