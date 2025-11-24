"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { tokenUtils, errorUtils, mapBackendRoles } from "@shared/core/utils";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { RoleKey } from "@shared/core/constants/role.constants";
import { useAuthCore } from "./useAuthCore.hook"; // Hook cốt lõi để quản lý state
import {
	loginApi,
	logoutApi,
	registerApi,
	changePasswordApi,
	refreshTokenApi,
	verifyTokenApi,
} from "./auth.api";
import {
	RegisterRequest,
	ChangePasswordRequest,
	MeResponse,
} from "./auth.types";

interface UseAuthManagerOptions {
	requiredRole?: RoleKey | RoleKey[];
	redirectAfterLogin?: string;
	redirectAfterLogout?: string;
	redirectAfterRegister?: string;
}

/**
 * Hook công khai, cung cấp các hành động (login, logout, register,...)
 * và trạng thái xác thực cho các component.
 */
export const useAuth = ({
	requiredRole,
	redirectAfterLogin = "/", // Mặc định về trang chủ sau khi đăng nhập
	redirectAfterLogout = "/login",
	redirectAfterRegister = "/login",
}: UseAuthManagerOptions = {}) => {
	// 1. Lấy state và các hàm quản lý state từ hook cốt lõi
	const { user, setUser, loading, setLoading, fetchUser } = useAuthCore();
	const router = useRouter();
	const { showToast } = useNotification();

	// 2. Tính toán các giá trị dẫn xuất từ state `user`
	const isAuthenticated = !!user;
	const userRoles = user ? mapBackendRoles(user.roles || []) : [];

	// Kiểm tra xem user có vai trò được yêu cầu không
	const isAuthorized = useCallback(() => {
		if (!requiredRole) return true; // Nếu không yêu cầu vai trò, luôn được phép
		if (!isAuthenticated) return false; // Nếu chưa đăng nhập, không được phép

		const requiredRolesArray = Array.isArray(requiredRole)
			? requiredRole
			: [requiredRole];
		return userRoles.some((role) => requiredRolesArray.includes(role));
	}, [isAuthenticated, requiredRole, userRoles]);

	// 3. Định nghĩa các HÀNH ĐỘNG
	const login = useCallback(
		async (usernameOrPhone: string, password: string) => {
			setLoading(true);
			try {
				const res = await loginApi({ usernameOrPhone, password });
				if (res.success) {
					showToast(res.message || "Đăng nhập thành công!", "success");
					await fetchUser();
					// Dùng hard navigation để giải quyết triệt để vấn đề cache của Next.js
					window.location.href = redirectAfterLogin;
				} else {
					showToast(res.message || "Đăng nhập thất bại", "error");
					setLoading(false);
				}
			} catch (error) {
				showToast(errorUtils.parseApiError(error), "error");
				setLoading(false);
			}
		},
		[setLoading, fetchUser, redirectAfterLogin, showToast]
	);

	const register = useCallback(
		async (data: RegisterRequest) => {
			setLoading(true);
			try {
				const res = await registerApi(data);
				if (res.success) {
					showToast(
						res.message || "Đăng ký thành công! Vui lòng đăng nhập.",
						"success"
					);
					router.push(redirectAfterRegister);
				} else {
					showToast(res.message || "Đăng ký thất bại", "error");
				}
			} catch (error) {
				showToast(errorUtils.parseApiError(error), "error");
			} finally {
				setLoading(false);
			}
		},
		[setLoading, router, redirectAfterRegister, showToast]
	);

	const logout = useCallback(async () => {
		try {
			await logoutApi();
			showToast("Đăng xuất thành công", "success");
		} catch (error) {
			console.error("Logout failed:", error);
			showToast("Có lỗi xảy ra khi đăng xuất", "error");
		} finally {
			// Luôn dọn dẹp và cập nhật state bất kể API thành công hay thất bại
			tokenUtils.clearTokens();
			setUser(null);
			// Dùng router.push ở đây an toàn vì không có vấn đề cache khi logout
			router.push(redirectAfterLogout);
		}
	}, [setUser, router, redirectAfterLogout, showToast]);

	const changePassword = useCallback(
		async (data: ChangePasswordRequest) => {
			setLoading(true);
			try {
				const res = await changePasswordApi(data);
				if (res.success) {
					showToast(res.message || "Đổi mật khẩu thành công!", "success");
					await fetchUser(); // Làm mới thông tin user
				} else {
					showToast(res.message || "Đổi mật khẩu thất bại!", "error");
				}
			} catch (error) {
				showToast(errorUtils.parseApiError(error), "error");
			} finally {
				setLoading(false);
			}
		},
		[setLoading, fetchUser, showToast]
	);

	// 4. Logic khởi tạo khi tải ứng dụng
	useEffect(() => {
		const initializeAuth = async () => {
			const token = tokenUtils.getAccessToken();
			if (token) {
				await fetchUser();
			}
			setLoading(false);
		};
		initializeAuth();
	}, [fetchUser, setLoading]);

	// 5. Trả về API công khai cho các component
	return {
		user,
		loading,
		isAuthenticated,
		isAuthorized: isAuthorized(), // Trả về kết quả của hàm
		login,
		register,
		logout,
		changePassword,
		refreshUser: fetchUser,
	};
};
