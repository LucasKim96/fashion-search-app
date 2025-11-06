import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, AUTH_ENDPOINTS } from "../constants/api.constants";
import { tokenUtils } from "../utils/token.utils";

// Tạo instance
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor request
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenUtils.getAccessToken();
  if (token && config.headers) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});


// Interceptor response
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Token hết hạn
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      tokenUtils.getRefreshToken()
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`, {
          refreshToken: tokenUtils.getRefreshToken(),
        });

        // Dùng optional chaining an toàn
        const newAccessToken = (data as any)?.data?.accessToken;
        if (newAccessToken) {
          tokenUtils.setTokens(newAccessToken);
          (originalRequest.headers as any).Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch {
        tokenUtils.clearTokens();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
