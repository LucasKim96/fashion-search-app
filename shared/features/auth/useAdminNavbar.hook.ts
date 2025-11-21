"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@shared/features/auth/AuthProvider";
import {
	errorUtils,
	extractUserDisplayInfo,
	useNotification,
} from "@shared/core/";

interface UseAdminNavbarOptions {
	profilePath?: string;
}

export const useAdminNavbar = (options: UseAdminNavbarOptions = {}) => {
	const router = useRouter();
	const { user: authUser, logout, refreshUser } = useAuthContext();
	const { showToast } = useNotification();

	// route mặc định nếu không truyền từ bên ngoài
	const profilePath = options.profilePath ?? "/";
	const [userInfo, setUserInfo] = useState<
		ReturnType<typeof extractUserDisplayInfo>
	>({});

	// ====== Cập nhật user info khi authUser thay đổi ======
	const fetchUserInfo = useCallback(() => {
		try {
			if (authUser) setUserInfo(extractUserDisplayInfo(authUser));
		} catch (error) {
			showToast(errorUtils.parseApiError(error), "error");
		}
	}, [authUser, showToast]);

	useEffect(() => {
		if (authUser) {
			setUserInfo(extractUserDisplayInfo(authUser));
		} else {
			// Xử lý trường hợp logout hoặc chưa có user
			setUserInfo({});
		}
	}, [authUser]);

	// ====== Xử lý click account ======
	const handleAccountClick = () => router.push(profilePath);

	// ====== Đăng xuất ======
	const handleLogout = async () => {
		try {
			const res = await logout();
		} catch (error) {
			showToast(errorUtils.parseApiError(error), "error");
		} finally {
			router.push("/login");
		}
	};

	return {
		user: authUser,
		userInfo,
		handleAccountClick,
		handleLogout,
		refreshUserInfo: refreshUser,
	};
};
