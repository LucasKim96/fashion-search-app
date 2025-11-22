// shared/features/product/product.utils.ts
import {
	ProductVariantBulkItem,
	CreateProductVariantsBulkRequest,
} from "@shared/features/product/productVariant.types";
import {
	CreateProductWithVariantsRequest,
	UpdateProductImagesRequest,
} from "@shared/features/product/product.types";
import { generateFileKey } from "./attribute.utils";

/**
 * Thêm fileKey cho các variant chưa có
 */
// export const assignFileKeysToVariants = (
// 	variants: ProductVariantBulkItem[]
// ): ProductVariantBulkItem[] => {
// 	return variants.map((v) => ({
// 		...v,
// 		fileKey: v.fileKey || generateFileKey(),
// 	}));
// };
export const assignFileKeysToVariants = (
	variants: ProductVariantBulkItem[]
): ProductVariantBulkItem[] => {
	return variants.map((v) => {
		// Nếu đã có fileKey từ FE (Div 4 gửi lên), giữ nguyên nó.
		// Nếu chưa có (trường hợp nào đó), mới sinh key ngẫu nhiên.
		return {
			...v,
			fileKey: v.fileKey ? v.fileKey : generateFileKey(),
		};
	});
};
/**
 * Tạo FormData cho việc tạo Product mới kèm variants và file
 *
 * formValues.images?: File[]          -> ảnh sản phẩm
 * formValues.variantsPayload?: ProductVariantBulkItem[] -> các biến thể
 * formValues.variantFiles?: Record<string, File> -> key trùng fileKey
 */
export const buildFormDataForCreateProduct = (
	formValues: CreateProductWithVariantsRequest
): FormData => {
	const formData = new FormData();

	formData.append("pdName", formValues.pdName);
	formData.append("basePrice", String(formValues.basePrice));
	if (formValues.description)
		formData.append("description", formValues.description);

	// Append ảnh sản phẩm
	formValues.images?.forEach((file) => formData.append("images", file));

	// Append variants
	if (formValues.variantsPayload) {
		const variantsWithKeys = assignFileKeysToVariants(
			formValues.variantsPayload
		);
		formData.append("variantsPayload", JSON.stringify(variantsWithKeys));

		// Append files cho từng variant
		variantsWithKeys.forEach((v) => {
			if (v.fileKey && (formValues as any)[v.fileKey]) {
				formData.append(v.fileKey, (formValues as any)[v.fileKey] as File);
			}
		});
	}

	return formData;
};

/**
 * Tạo FormData cho bulk create variant
 *
 * payload.productId: string
 * payload.variantsPayload: ProductVariantBulkItem[]
 * payload.files?: Record<string, File> -> key trùng fileKey
 */
export const buildFormDataForBulkCreateVariants = (
	payload: CreateProductVariantsBulkRequest & { files?: Record<string, File> }
): FormData => {
	const formData = new FormData();
	formData.append("productId", payload.productId);

	// gán fileKey nếu chưa có
	const variantsWithKeys = assignFileKeysToVariants(payload.variantsPayload);
	formData.append("variantsPayload", JSON.stringify(variantsWithKeys));

	// append file nếu có
	variantsWithKeys.forEach((v) => {
		if (v.fileKey && payload.files?.[v.fileKey]) {
			formData.append(v.fileKey, payload.files[v.fileKey]);
		}
	});

	return formData;
};

/**
 * Tạo FormData cho việc update ảnh sản phẩm
 */
export const buildFormDataForUpdateImages = (
	payload: UpdateProductImagesRequest
): FormData => {
	const formData = new FormData();
	payload.images?.forEach((file) => formData.append("images", file));
	if (payload.keepImages)
		formData.append("keepImages", JSON.stringify(payload.keepImages));
	if (payload.mode) formData.append("mode", payload.mode);
	return formData;
};
