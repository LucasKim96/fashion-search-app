import { AxiosError } from "axios";
import { ApiResponse } from "../../types/common.types";

export const errorUtils = {
  parseApiError: (error: unknown): string => {
    if (error instanceof AxiosError) {
      const response = error.response;
      const data = response?.data as Partial<ApiResponse> | any;

      // Ưu tiên lấy message từ BE
      if (data?.message) return data.message;

      // Trường hợp BE trả lỗi dạng khác
      if (data?.error) return data.error;
      if (Array.isArray(data?.errors) && data.errors[0]?.msg)
        return data.errors[0].msg;

      // Nếu có status text (vd: Bad Request)
      if (response?.statusText) return response.statusText;

      // Cuối cùng: fallback về Axios message
      return error.message || "Lỗi không xác định từ máy chủ";
    }

    if (error instanceof Error) return error.message;

    return "Đã xảy ra lỗi không xác định.";
  },
};
