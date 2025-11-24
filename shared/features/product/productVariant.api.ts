// shared/features/product/productVariant.api.ts
import { axiosInstance } from "@shared/core/api/axiosInstance";
import { PRODUCT_VARIANT_ENDPOINTS } from "@shared/core/constants/api.constants";
import { ApiResponse } from "@shared/types/common.types";
import {
	ProductVariant,
	GenerateVariantCombinationsRequest,
	VariantGeneratedItem,
	GenerateNewVariantCombinationsRequest,
	ProductAttributeWithValues,
	ProductVariantBulkItem,
	CreateProductVariantsBulkRequest,
	UpdateProductVariantRequest,
} from "./productVariant.types";

// ========================= PUBLIC API =========================
export const generateVariantCombinations = async (
	payload: GenerateVariantCombinationsRequest
): Promise<ApiResponse<VariantGeneratedItem[]>> => {
	const res = await axiosInstance.post<ApiResponse<VariantGeneratedItem[]>>(
		PRODUCT_VARIANT_ENDPOINTS.GENERATE,
		payload
	);
	return res.data;
};

export const generateNewVariantCombinations = async (
	payload: GenerateNewVariantCombinationsRequest
): Promise<ApiResponse<VariantGeneratedItem[]>> => {
	const res = await axiosInstance.post<ApiResponse<VariantGeneratedItem[]>>(
		PRODUCT_VARIANT_ENDPOINTS.GENERATE_NEW,
		payload
	);
	return res.data;
};

export const getProductAttributesWithValues = async (
	productId: string
): Promise<ApiResponse<ProductAttributeWithValues[]>> => {
	const res = await axiosInstance.get<
		ApiResponse<ProductAttributeWithValues[]>
	>(PRODUCT_VARIANT_ENDPOINTS.GET_ATTRIBUTES(productId));
	return res.data;
};

export const bulkCreateProductVariants = async (
	formData: FormData
): Promise<ApiResponse<ProductVariant[]>> => {
	const res = await axiosInstance.post<ApiResponse<ProductVariant[]>>(
		PRODUCT_VARIANT_ENDPOINTS.BULK_CREATE,
		formData,
		{ headers: { "Content-Type": "multipart/form-data" } }
	);
	return res.data;
};

export const updateProductVariant = async (
	variantId: string,
	payload: UpdateProductVariantRequest | FormData
): Promise<ApiResponse<ProductVariant>> => {
	let data: FormData | UpdateProductVariantRequest = payload;

	// Nếu là object có file (FormData) thì dùng multipart
	const headers =
		payload instanceof FormData
			? { "Content-Type": "multipart/form-data" }
			: undefined;

	const res = await axiosInstance.put<ApiResponse<ProductVariant>>(
		PRODUCT_VARIANT_ENDPOINTS.UPDATE(variantId),
		data,
		{ headers }
	);
	return res.data;
};
