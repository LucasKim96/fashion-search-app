import { axiosInstance } from "../../core/api/axiosInstance";
import { SEARCH_ENDPOINTS } from "../../core/constants/api.constants";
import { ApiResponse } from "../../types/common.types";
import {
	DetectResponseData,
	ProductSearchResult,
	SearchImageResponseData,
} from "./search.types";

/**
 * Bước 1: Gửi ảnh gốc để AI phát hiện các vùng (Candidates)
 */
export const detectObjects = async (
	file: File
): Promise<ApiResponse<DetectResponseData>> => {
	const formData = new FormData();
	formData.append("image", file);

	const response = await axiosInstance.post<ApiResponse<DetectResponseData>>(
		SEARCH_ENDPOINTS.DETECT_SEARCH,
		formData,
		{
			headers: { "Content-Type": "multipart/form-data" },
		}
	);
	return response.data;
};

/**
 * Bước 2: Gửi ảnh đã crop để tìm kiếm sản phẩm
 */
export const searchByImage = async (
	imageBlob: Blob
): Promise<ApiResponse<SearchImageResponseData>> => {
	const formData = new FormData();
	// Convert Blob -> File
	const file = new File([imageBlob], "crop.jpg", { type: "image/jpeg" });

	formData.append("image", file);

	const response = await axiosInstance.post<
		ApiResponse<SearchImageResponseData>
	>(SEARCH_ENDPOINTS.SEARCH, formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
	return response.data;
};

// Endpoint tìm kiếm Text (AI PhoCLIP)
export const searchByTextApi = async (query: string, limit = 60) => {
	const res = await axiosInstance.get<ApiResponse<ProductSearchResult[]>>(
		"/search/text", // Khớp với route backend
		{
			params: { query, limit },
		}
	);
	return res.data;
};
