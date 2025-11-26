// client/features/shop/shop.api.ts
import { axiosInstance } from "@shared/core/api/axiosInstance";
import { SHOP_ENDPOINTS } from "@shared/core/constants/api.constants";
import { ApiResponse } from "@shared/types/common.types";
import { CreateShopRequest, ShopResponse } from "./shop.types";

// Lấy danh sách shop
export const getShopsApi = () =>
	axiosInstance
		.get<ApiResponse<ShopResponse[]>>(SHOP_ENDPOINTS.GET_ALL)
		.then((res) => res.data);

// Lấy shop theo id
export const getShopByIdApi = (id: string) =>
	axiosInstance
		.get<ApiResponse<ShopResponse>>(SHOP_ENDPOINTS.BY_ID(id))
		.then((res) => res.data);

export const getMyShopApi = () =>
	axiosInstance
		.get<ApiResponse<ShopResponse>>(SHOP_ENDPOINTS.GET_MINE) // Giả sử GET_MINE = '/shops/mine'
		.then((res) => res.data);

// Tạo shop mới
export const createShopApi = (formData: FormData) =>
	axiosInstance
		.post<ApiResponse<ShopResponse>>(SHOP_ENDPOINTS.CREATE, formData)
		.then((res) => res.data);

// Cập nhật shop
export const updateShopApi = (id: string, data: Partial<CreateShopRequest>) =>
	axiosInstance
		.put<ApiResponse<ShopResponse>>(SHOP_ENDPOINTS.UPDATE(id), data)
		.then((res) => res.data);

// Xóa shop
export const hardDeleteMyShopApi = () =>
	axiosInstance.delete("/shops/owner/hard-delete/mine").then((res) => res.data);

export const getMyShopForManagementApi = () =>
	axiosInstance.get("/shops/owner/management").then((res) => res.data);

export const closeMyShopApi = () =>
	axiosInstance.patch("/shops/owner/close/mine").then((res) => res.data);

export const reopenMyShopApi = () =>
	axiosInstance.patch("/shops/owner/reopen/mine").then((res) => res.data);

// Thay đổi trạng thái shop
export const changeShopStatusApi = (id: string, status: string) =>
	axiosInstance
		.patch<ApiResponse>(SHOP_ENDPOINTS.CHANGE_STATUS(id), { status })
		.then((res) => res.data);

// Cập nhật logo
export const updateShopLogoApi = (id: string, logoFile: File) => {
	const formData = new FormData();
	formData.append("logo", logoFile);
	return axiosInstance
		.put<ApiResponse<ShopResponse>>(SHOP_ENDPOINTS.UPDATE_LOGO(id), formData, {
			headers: { "Content-Type": "multipart/form-data" },
		})
		.then((res) => res.data);
};

// Cập nhật cover
export const updateShopCoverApi = (id: string, coverFile: File) => {
	const formData = new FormData();
	formData.append("cover", coverFile);
	return axiosInstance
		.put<ApiResponse<ShopResponse>>(SHOP_ENDPOINTS.UPDATE_COVER(id), formData, {
			headers: { "Content-Type": "multipart/form-data" },
		})
		.then((res) => res.data);
};

// Restore shop (admin)
export const restoreShopApi = (id: string) =>
	axiosInstance
		.patch<ApiResponse>(SHOP_ENDPOINTS.RESTORE(id))
		.then((res) => res.data);

// Cập nhật default logo/cover (admin)
export const updateDefaultLogoApi = (file: File) => {
	const formData = new FormData();
	formData.append("defaultLogo", file);
	return axiosInstance
		.put<ApiResponse>(SHOP_ENDPOINTS.UPDATE_DEFAULT_LOGO, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		})
		.then((res) => res.data);
};

export const updateDefaultCoverApi = (file: File) => {
	const formData = new FormData();
	formData.append("defaultCover", file);
	return axiosInstance
		.put<ApiResponse>(SHOP_ENDPOINTS.UPDATE_DEFAULT_COVER, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		})
		.then((res) => res.data);
};

// Cleanup null shops (super admin)
export const cleanupNullShopsApi = () =>
	axiosInstance
		.delete<ApiResponse>(SHOP_ENDPOINTS.CLEANUP_NULL)
		.then((res) => res.data);
