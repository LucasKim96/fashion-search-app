// shared/features/product/product.api.ts
import { axiosInstance, PRODUCT_ENDPOINTS } from "@shared/core";
import { ApiResponse } from "@shared/types/common.types";
import {
	Product,
	CreateProductWithVariantsRequest,
	UpdateProductBasicInfoRequest,
	UpdateProductImagesRequest,
	ProductSearchRequest,
	ProductSearchResponseDataAdmin,
	ProductSearchResponseDataShop,
	ProductCountResponse,
} from "./product.types";

/** ========================= PUBLIC API ========================= */

// Lấy danh sách sản phẩm public
// Lấy danh sách sản phẩm public
export const getPublicProducts = async (
	params?: { page?: number; limit?: number } // <-- Thêm tham số `params`
): Promise<ApiResponse<Product[]>> => {
	const res = await axiosInstance.get<ApiResponse<Product[]>>(
		PRODUCT_ENDPOINTS.PUBLIC_LIST,
		{ params } // <-- Truyền `params` vào request của axios
	);
	return res.data;
};

// Lấy danh sách sản phẩm public theo shop
export const getPublicProductsByShop = async (
	shopId: string
): Promise<ApiResponse<Product[]>> => {
	// --- SỬA Ở ĐÂY ---
	// Gọi hàm và truyền `shopId` vào
	const url = PRODUCT_ENDPOINTS.PUBLIC_LIST_BY_SHOP(shopId);

	// Không cần `params` nữa vì `shopId` đã nằm trong URL
	const res = await axiosInstance.get<ApiResponse<Product[]>>(url);

	return res.data;
};

// Xem chi tiết sản phẩm
export const getProductDetail = async (
	productId: string
): Promise<ApiResponse<Product>> => {
	const res = await axiosInstance.get<ApiResponse<Product>>(
		PRODUCT_ENDPOINTS.PUBLIC_DETAIL(productId)
	);
	return res.data;
};

// Đếm số lượng sản phẩm public của shop
export const countProductsByShop = async (
	shopId: string
): Promise<ApiResponse<number>> => {
	const res = await axiosInstance.get<ApiResponse<number>>(
		PRODUCT_ENDPOINTS.PUBLIC_COUNT_SHOP(shopId)
	);
	return res.data;
};

/** ========================= ADMIN API ========================= */

// Lấy danh sách sản phẩm admin
export const getAllProductsAdmin = async (): Promise<
	ApiResponse<Product[]>
> => {
	const res = await axiosInstance.get<ApiResponse<Product[]>>(
		PRODUCT_ENDPOINTS.ADMIN_LIST
	);
	return res.data;
};

// Lấy danh sách sản phẩm admin (search + filter)
export const searchProductsAdmin = async (
	params?: ProductSearchRequest
): Promise<ApiResponse<ProductSearchResponseDataAdmin>> => {
	const res = await axiosInstance.get<
		ApiResponse<ProductSearchResponseDataAdmin>
	>(PRODUCT_ENDPOINTS.ADMIN_LIST + "/search", { params });
	return res.data;
};

// Đếm tổng số sản phẩm admin
export const countAllProductsAdmin = async (
	includeInactive = true
): Promise<ApiResponse<ProductCountResponse>> => {
	const res = await axiosInstance.get<ApiResponse<ProductCountResponse>>(
		`${PRODUCT_ENDPOINTS.ADMIN_COUNT}?includeInactive=${includeInactive}`
	);
	return res.data;
};

// Xem chi tiết sản phẩm (admin)
export const getProductDetailAdmin = async (
	productId: string
): Promise<ApiResponse<Product>> => {
	const res = await axiosInstance.get<ApiResponse<Product>>(
		PRODUCT_ENDPOINTS.ADMIN_DETAIL(productId)
	);
	return res.data;
};

// Bật/tắt trạng thái sản phẩm (admin)
export const toggleProductActive = async (
	productId: string
): Promise<ApiResponse<Product>> => {
	const res = await axiosInstance.patch<ApiResponse<Product>>(
		PRODUCT_ENDPOINTS.ADMIN_TOGGLE(productId)
	);
	return res.data;
};

// Xóa sản phẩm (admin)
export const deleteProductAdmin = async (
	productId: string
): Promise<ApiResponse<null>> => {
	const res = await axiosInstance.delete<ApiResponse<null>>(
		PRODUCT_ENDPOINTS.ADMIN_DELETE(productId)
	);
	return res.data;
};

/** ========================= SHOP API ========================= */

// Lấy danh sách sản phẩm của shop
export const getShopProducts = async (): Promise<ApiResponse<Product[]>> => {
	const res = await axiosInstance.get<ApiResponse<Product[]>>(
		PRODUCT_ENDPOINTS.SHOP_LIST
	);
	return res.data;
};

// Lấy danh sách sản phẩm của shop (search + filter)
export const searchProductsShop = async (
	params?: ProductSearchRequest
): Promise<ApiResponse<ProductSearchResponseDataShop>> => {
	const res = await axiosInstance.get<
		ApiResponse<ProductSearchResponseDataShop>
	>(PRODUCT_ENDPOINTS.SHOP_LIST + "/search", { params });
	return res.data;
};

// Đếm số lượng sản phẩm của shop
export const countShopProducts = async (
	includeInactive = true
): Promise<ApiResponse<ProductCountResponse>> => {
	const res = await axiosInstance.get<ApiResponse<ProductCountResponse>>(
		`${PRODUCT_ENDPOINTS.SHOP_COUNT}?includeInactive=${includeInactive}`
	);
	return res.data;
};

// Tạo sản phẩm mới (FormData: kèm biến thể & file)
export const createShopProduct = async (
	formData: FormData
): Promise<ApiResponse<Product>> => {
	const res = await axiosInstance.post<ApiResponse<Product>>(
		PRODUCT_ENDPOINTS.SHOP_CREATE,
		formData,
		{
			headers: { "Content-Type": "multipart/form-data" },
		}
	);
	return res.data;
};

// Cập nhật thông tin cơ bản sản phẩm
export const updateShopProductBasic = async (
	productId: string,
	payload: UpdateProductBasicInfoRequest
): Promise<ApiResponse<Product>> => {
	const res = await axiosInstance.put<ApiResponse<Product>>(
		PRODUCT_ENDPOINTS.SHOP_UPDATE_BASIC(productId),
		payload
	);
	return res.data;
};

// Cập nhật ảnh sản phẩm (FormData)
export const updateShopProductImages = async (
	productId: string,
	formData: FormData
): Promise<ApiResponse<Product>> => {
	const res = await axiosInstance.put<ApiResponse<Product>>(
		PRODUCT_ENDPOINTS.SHOP_UPDATE_IMAGES(productId),
		formData,
		{ headers: { "Content-Type": "multipart/form-data" } }
	);
	return res.data;
};

// Bật/tắt trạng thái sản phẩm (shop)
export const toggleShopProduct = async (
	productId: string
): Promise<ApiResponse<Product>> => {
	const res = await axiosInstance.patch<ApiResponse<Product>>(
		PRODUCT_ENDPOINTS.SHOP_TOGGLE(productId)
	);
	return res.data;
};

// Xóa sản phẩm (shop)
export const deleteShopProduct = async (
	productId: string
): Promise<ApiResponse<null>> => {
	const res = await axiosInstance.delete<ApiResponse<null>>(
		PRODUCT_ENDPOINTS.SHOP_DELETE(productId)
	);
	return res.data;
};
