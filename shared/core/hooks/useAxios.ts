// // shared/core/hooks/useAxios.ts
// "use client";

// import { useEffect } from "react";
// import axiosInstance from "@shared/core/api/axiosInstance";
// import { tokenUtils } from "@shared/core/utils/token.utils";
// import { refreshTokenApi } from "@shared/features/auth";

// const useAxios = () => {
// 	useEffect(() => {
// 		const requestInterceptor = axiosInstance.interceptors.request.use(
// 			(config) => {
// 				const token = tokenUtils.getAccessToken();
// 				if (token) {
// 					config.headers.Authorization = `Bearer ${token}`;
// 				}
// 				return config;
// 			},
// 			(error) => Promise.reject(error)
// 		);

// 		const responseInterceptor = axiosInstance.interceptors.response.use(
// 			(response) => response,
// 			async (error) => {
// 				const originalRequest = error.config as any;

// 				// Nếu 401 và chưa retry
// 				if (
// 					error.response?.status === 401 &&
// 					!originalRequest._retry &&
// 					tokenUtils.getRefreshToken()
// 				) {
// 					originalRequest._retry = true;
// 					try {
// 						const refreshToken = tokenUtils.getRefreshToken()!;
// 						const res = await refreshTokenApi(refreshToken);

// 						if (res.success && res.data?.accessToken) {
// 							// Set access token mới
// 							tokenUtils.setTokens(res.data.accessToken, refreshToken);
// 							originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
// 							return axiosInstance(originalRequest);
// 						} else {
// 							tokenUtils.clearTokens();
// 							window.location.href = "/login"; // redirect về login
// 						}
// 					} catch {
// 						tokenUtils.clearTokens();
// 						window.location.href = "/login";
// 					}
// 				}

// 				return Promise.reject(error);
// 			}
// 		);

// 		return () => {
// 			axiosInstance.interceptors.request.eject(requestInterceptor);
// 			axiosInstance.interceptors.response.eject(responseInterceptor);
// 		};
// 	}, []);

// 	return axiosInstance;
// };

// export default useAxios;

// shared/core/hooks/useAxios.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Dùng router của Next thay vì window.location
import axiosInstance from "@shared/core/api/axiosInstance";
import { tokenUtils } from "@shared/core/utils/token.utils";
import { refreshTokenApi } from "@shared/features/auth";

const useAxios = () => {
	const router = useRouter();

	useEffect(() => {
		// 1. REQUEST INTERCEPTOR
		const requestInterceptor = axiosInstance.interceptors.request.use(
			(config) => {
				// tokenUtils đã sửa ở bước 1 nên an toàn
				const token = tokenUtils.getAccessToken();
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => Promise.reject(error)
		);

		// 2. RESPONSE INTERCEPTOR
		const responseInterceptor = axiosInstance.interceptors.response.use(
			(response) => response,
			async (error) => {
				const originalRequest = error.config;

				// Nếu lỗi 401 và chưa retry
				if (error.response?.status === 401 && !originalRequest._retry) {
					// Kiểm tra có refresh token không trước khi thử
					const storedRefreshToken = tokenUtils.getRefreshToken();
					if (!storedRefreshToken) {
						// Không có refresh token thì logout luôn
						tokenUtils.clearTokens();
						// window.location.href = "/login"; // Cách này reload lại trang (an toàn nhất để xóa state rác)
						router.push("/login"); // Cách này mượt hơn (SPA)
						return Promise.reject(error);
					}

					originalRequest._retry = true;

					try {
						// Gọi API refresh
						const res = await refreshTokenApi(storedRefreshToken);

						if (res.success && res.data?.accessToken) {
							// Lưu token mới
							tokenUtils.setTokens(res.data.accessToken, storedRefreshToken);

							// Gắn token mới vào header của request cũ
							originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;

							// Gọi lại request cũ với token mới
							return axiosInstance(originalRequest);
						}
					} catch (refreshError) {
						// Refresh thất bại (token hết hạn hoặc lỗi server)
						tokenUtils.clearTokens();
						router.push("/login");
						return Promise.reject(refreshError);
					}
				}

				return Promise.reject(error);
			}
		);

		// Cleanup: Gỡ interceptor khi component unmount để tránh bị duplicate interceptor
		return () => {
			axiosInstance.interceptors.request.eject(requestInterceptor);
			axiosInstance.interceptors.response.eject(responseInterceptor);
		};
	}, [router]); // Thêm router vào dependency

	return axiosInstance;
};

export default useAxios;
