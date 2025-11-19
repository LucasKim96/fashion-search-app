"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	tokenUtils,
	mapBackendRoles,
	RoleKey,
	errorUtils,
	useNotification,
} from "@shared/core";
import {
	MeResponse,
	RegisterRequest,
	ChangePasswordRequest,
} from "./auth.types";
import {
	getMeApi,
	refreshTokenApi,
	logoutApi,
	loginApi,
	registerApi,
	changePasswordApi,
	verifyTokenApi,
} from "./auth.api";

interface UseAuthManagerOptions {
	requiredRole?: RoleKey | RoleKey[];
	redirectAfterLogin?: string;
	redirectAfterLogout?: string;
	redirectAfterRegister?: string;
}

export const useAuth = ({
	requiredRole,
	redirectAfterLogin = "/dashboard",
	redirectAfterLogout = "/login",
	redirectAfterRegister = "/login",
}: UseAuthManagerOptions = {}) => {
	const [user, setUser] = useState<MeResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [isAuthorized, setIsAuthorized] = useState(true);
	const router = useRouter();
	const { showToast } = useNotification();

	// ====== Lấy thông tin user ======
	const fetchUser = useCallback(async () => {
		// KHÔNG SET LOADING Ở ĐÂY NỮA
		try {
			const res = await getMeApi();
			if (res.success && res.data) {
				// console.log("FETCH_USER: Đang set user state với dữ liệu:", res.data);
				setUser(res.data);
				// ... logic isAuthorized
			} else {
				tokenUtils.clearTokens();
				setUser(null);
				setIsAuthorized(false);
			}
		} catch (error) {
			// ...
			tokenUtils.clearTokens();
			setUser(null);
			setIsAuthorized(false);
		}
		// --- XÓA HOÀN TOÀN KHỐI `finally` Ở ĐÂY ---
	}, [requiredRole, showToast]);

	// ====== Helper: chạy API và tự động fetch lại user ======
	const runAndRefreshUser = useCallback(
		async <T>(
			apiCall: () => Promise<{ success: boolean; message?: string; data?: T }>
		) => {
			const res = await apiCall();
			if (res.success) {
				await fetchUser(); // tự động refresh user sau khi update
			}
			return res;
		},
		[fetchUser]
	);

	// ====== Đăng nhập ======
	const login = useCallback(
		async (usernameOrPhone: string, password: string) => {
			setLoading(true);
			try {
				const res = await loginApi({ usernameOrPhone, password });

				if (res.success) {
					showToast(res.message || "Đăng nhập thành công!", "success");

					// State vẫn được cập nhật để tránh "chớp" giao diện nếu có thể
					await fetchUser();

					// --- THAY ĐỔI QUYẾT ĐỊNH Ở ĐÂY ---
					// Thay vì router.push, dùng window.location.href để buộc full-page reload
					window.location.href = redirectAfterLogin; // redirectAfterLogin của bạn nên là "/"
				} else {
					showToast(res.message || "Đăng nhập thất bại", "error");
					setLoading(false); // Tắt loading nếu đăng nhập thất bại
				}

				// Không return res nữa vì trang sẽ được tải lại hoàn toàn
			} catch (error) {
				const message = errorUtils.parseApiError(error);
				showToast(message, "error");
				setLoading(false); // Tắt loading nếu có lỗi
			}
			// Không cần `finally` nữa vì logic loading và chuyển trang đã được xử lý
		},
		[fetchUser, redirectAfterLogin, showToast]
	);

	// ====== Đăng ký ======
	const register = useCallback(
		async (data: RegisterRequest) => {
			setLoading(true);
			try {
				const res = await registerApi(data);
				if (res.success) {
					showToast(res.message || "Đăng ký thành công!", "success");
					router.push(redirectAfterRegister);
				} else {
					showToast(res.message || "Đăng ký thất bại", "error");
				}
				return res;
			} catch (error) {
				const message = errorUtils.parseApiError(error);
				showToast(message, "error");
				return { success: false, message, data: null };
			} finally {
				setLoading(false);
			}
		},
		[router, redirectAfterRegister, showToast]
	);

	// ====== Đổi mật khẩu ======
	const changePassword = useCallback(
		async (data: ChangePasswordRequest) => {
			try {
				const res = await runAndRefreshUser(() => changePasswordApi(data));
				if (res.success) {
					showToast(res.message || "Đổi mật khẩu thành công!", "success");
				} else {
					showToast(res.message || "Đổi mật khẩu thất bại!", "error");
				}
				return res;
			} catch (error) {
				const message = errorUtils.parseApiError(error);
				showToast(message, "error");
				return { success: false, message, data: null };
			}
		},
		[runAndRefreshUser, showToast]
	);

	// ====== Làm mới token ======
	const handleRefreshToken = useCallback(async () => {
		const refreshToken = tokenUtils.getRefreshToken();
		if (!refreshToken) {
			tokenUtils.clearTokens();
			setUser(null);
			setIsAuthorized(false);
			setLoading(false);
			return;
		}

		try {
			const res = await refreshTokenApi(refreshToken);
			if (res.success && res.data?.accessToken) {
				await fetchUser();
			} else {
				tokenUtils.clearTokens();
				setUser(null);
				setIsAuthorized(false);
			}
		} catch (error) {
			const message = errorUtils.parseApiError(error);
			showToast(message, "error");
			tokenUtils.clearTokens();
			setUser(null);
			setIsAuthorized(false);
		} finally {
			setLoading(false);
		}
	}, [fetchUser, showToast]);

	// ====== Đăng xuất ======
	const logout = useCallback(async () => {
		let result: { success: boolean; message?: string; data?: any } = {
			success: false,
		};
		try {
			const res = await logoutApi();
			if (res.success) {
				showToast(res.message || "Đăng xuất thành công", "success");
			} else {
				showToast(res.message || "Đăng xuất thất bại", "error");
			}
			result = res; // Lưu lại kết quả thành công
		} catch (error) {
			const message = errorUtils.parseApiError(error);
			showToast(message, "error");
			result = { success: false, message }; // Lưu lại kết quả thất bại
		} finally {
			// Logic dọn dẹp và chuyển hướng vẫn nằm trong finally
			tokenUtils.clearTokens();
			setUser(null);
			setIsAuthorized(false);
			router.push(redirectAfterLogout);
		}
		// Trả về kết quả đã được lưu lại
		return result;
	}, [router, redirectAfterLogout, showToast]);

	// ====== Xác minh token ======
	const verifyToken = useCallback(async () => {
		try {
			const res = await verifyTokenApi();
			if (!res.success) {
				tokenUtils.clearTokens();
				setUser(null);
				setIsAuthorized(false);
			}
			return res;
		} catch (error) {
			const message = errorUtils.parseApiError(error);
			showToast(message, "error");
			tokenUtils.clearTokens();
			setUser(null);
			setIsAuthorized(false);
			return { success: false, message };
		}
	}, [showToast]);

	// ====== Khởi động ======
	useEffect(() => {
		const token = tokenUtils.getAccessToken();

		const initializeAuth = async () => {
			if (token) {
				await fetchUser(); // Chờ fetch user
			} else {
				setUser(null);
				setIsAuthorized(false);
			}
			setLoading(false); // Tắt loading sau khi khởi tạo xong
		};

		initializeAuth();
	}, [fetchUser]); // Giữ nguyên dependency

	return {
		user,
		loading,
		isAuthenticated: !!user,
		isAuthorized,
		login,
		register,
		logout,
		changePassword,
		verifyToken,
		refreshUser: fetchUser,
		handleRefreshToken,
	};
};
