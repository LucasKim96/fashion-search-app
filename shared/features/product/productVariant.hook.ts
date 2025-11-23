"use client";

import { useState, useCallback } from "react";
import * as ProductVariantApi from "./productVariant.api";
import {
	ProductVariant,
	VariantGeneratedItem,
	ProductAttributeWithValues,
	UpdateProductVariantRequest,
	GenerateNewVariantCombinationsRequest,
} from "./productVariant.types";
import { ApiResponse } from "@shared/types/common.types";
import { useNotification, errorUtils } from "@shared/core";

// Import reloadShopProducts trực tiếp
import { useProduct } from "../product/product.hook";

export const useProductVariant = () => {
	const { showToast } = useNotification();
	const { getShopProducts: reloadShopProducts } = useProduct();

	// ====================== PUBLIC ======================
	const [publicAttributes, setPublicAttributes] = useState<
		ProductAttributeWithValues[] | null
	>(null);
	const [loadingPublicAttributes, setLoadingPublicAttributes] = useState(false);
	const [errorPublicAttributes, setErrorPublicAttributes] = useState<
		string | null
	>(null);

	const [generatedVariants, setGeneratedVariants] = useState<
		VariantGeneratedItem[] | null
	>(null);
	const [loadingGeneratedVariants, setLoadingGeneratedVariants] =
		useState(false);
	const [errorGeneratedVariants, setErrorGeneratedVariants] = useState<
		string | null
	>(null);

	// State riêng cho generateNewVariantCombinations (kiểu trả về khác)
	const [newGeneratedVariants, setNewGeneratedVariants] = useState<
		VariantGeneratedItem[] | null
	>(null);
	const [loadingNewGeneratedVariants, setLoadingNewGeneratedVariants] =
		useState(false);
	const [errorNewGeneratedVariants, setErrorNewGeneratedVariants] = useState<
		string | null
	>(null);

	// ====================== SHOP ======================
	const [createdVariants, setCreatedVariants] = useState<
		ProductVariant[] | null
	>(null);
	const [loadingCreatedVariants, setLoadingCreatedVariants] = useState(false);
	const [errorCreatedVariants, setErrorCreatedVariants] = useState<
		string | null
	>(null);

	const [updatedVariant, setUpdatedVariant] = useState<ProductVariant | null>(
		null
	);
	const [loadingUpdatedVariant, setLoadingUpdatedVariant] = useState(false);
	const [errorUpdatedVariant, setErrorUpdatedVariant] = useState<string | null>(
		null
	);

	// ====================== PUBLIC ACTIONS ======================
	const getProductAttributesWithValues = useCallback(
		async (
			productId: string
		): Promise<ApiResponse<ProductAttributeWithValues[]>> => {
			setLoadingPublicAttributes(true);
			setErrorPublicAttributes(null);
			try {
				const res = await ProductVariantApi.getProductAttributesWithValues(
					productId
				);
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
			payload: Parameters<
				typeof ProductVariantApi.generateVariantCombinations
			>[0]
		): Promise<ApiResponse<VariantGeneratedItem[]>> => {
			setLoadingGeneratedVariants(true);
			setErrorGeneratedVariants(null);
			try {
				const res = await ProductVariantApi.generateVariantCombinations(
					payload
				);
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
			payload: Parameters<
				typeof ProductVariantApi.generateNewVariantCombinations
			>[0]
		): Promise<ApiResponse<VariantGeneratedItem[]>> => {
			setLoadingNewGeneratedVariants(true);
			setErrorNewGeneratedVariants(null);
			try {
				const res = await ProductVariantApi.generateNewVariantCombinations(
					payload
				);
				if (res.success) setNewGeneratedVariants(res.data);
				else setErrorNewGeneratedVariants(res.message || "Lỗi API");
				return res;
			} catch (err) {
				const msg = errorUtils.parseApiError(err);
				setErrorNewGeneratedVariants(msg);
				showToast(msg, "error");
				return { success: false, message: msg, data: null };
			} finally {
				setLoadingNewGeneratedVariants(false);
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
					//await reloadShopProducts();
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
				const res = await ProductVariantApi.updateProductVariant(
					variantId,
					payload
				);
				if (res.success) {
					setUpdatedVariant(res.data);
					showToast(res.message || "Cập nhật variant thành công", "success");
					//await reloadShopProducts();
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
		publicVariantState: {
			data: publicAttributes,
			loading: loadingPublicAttributes,
			error: errorPublicAttributes,
		},
		generatedVariantsState: {
			data: generatedVariants,
			loading: loadingGeneratedVariants,
			error: errorGeneratedVariants,
		},
		newGeneratedVariantsState: {
			data: newGeneratedVariants,
			loading: loadingNewGeneratedVariants,
			error: errorNewGeneratedVariants,
		},
		createdVariantsState: {
			data: createdVariants,
			loading: loadingCreatedVariants,
			error: errorCreatedVariants,
		},
		updatedVariantState: {
			data: updatedVariant,
			loading: loadingUpdatedVariant,
			error: errorUpdatedVariant,
		},

		// ====== ACTIONS ======
		getProductAttributesWithValues,
		generateVariantCombinations,
		generateNewVariantCombinations,
		bulkCreateProductVariants,
		updateProductVariant,
	};
};
