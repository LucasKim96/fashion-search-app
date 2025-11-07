import { ApiResponse } from "@shared/types/common.types";
import { useNotification } from "@shared/core/ui/NotificationProvider";

export const useApiNotification = () => {
  const { showToast } = useNotification();

  const handleApiResponse = <T>(response: ApiResponse<T>) => {
    if (response.success) {
      showToast(response.message || "Thao tác thành công", "success");
    } else {
      showToast(response.message || "Đã xảy ra lỗi", "error");
    }
  };

  const handleApiError = (error: unknown) => {
    showToast("Lỗi không xác định từ máy chủ", "error");
  };

  return { handleApiResponse, handleApiError };
};
