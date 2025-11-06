// shared/core/hooks/useAxios.ts
import { useEffect } from "react";
import axiosInstance from "@shared/core/api/axiosInstance";
import { tokenUtils } from "@shared/core/utils/token.utils";
import { refreshTokenApi } from "@shared/features/auth";

const useAxios = () => {
  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        const token = tokenUtils.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as any;

        // Nếu 401 và chưa retry
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          tokenUtils.getRefreshToken()
        ) {
          originalRequest._retry = true;
          try {
            const refreshToken = tokenUtils.getRefreshToken()!;
            const res = await refreshTokenApi(refreshToken);

            if (res.success && res.data?.accessToken) {
              // Set access token mới
              tokenUtils.setTokens(res.data.accessToken, refreshToken);
              originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
              return axiosInstance(originalRequest);
            } else {
              tokenUtils.clearTokens();
              window.location.href = "/login"; // redirect về login
            }
          } catch {
            tokenUtils.clearTokens();
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return axiosInstance;
};

export default useAxios;
