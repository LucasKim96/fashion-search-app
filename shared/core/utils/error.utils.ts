import { AxiosError } from "axios";
import { ApiResponse } from "../../types/common.types";

export const errorUtils = {
  parseApiError: (error: unknown): string => {
    if (error instanceof AxiosError) {
      const responseData = error.response?.data as ApiResponse | undefined;
      return (
        responseData?.message ||
        error.response?.statusText ||
        "Lỗi không xác định từ máy chủ"
      );
    }

    if (error instanceof Error) return error.message;

    return "Đã xảy ra lỗi không xác định.";
  },
};
