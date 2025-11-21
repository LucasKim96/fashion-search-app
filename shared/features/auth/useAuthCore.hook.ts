"use client";

import { useState, useCallback } from "react";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { tokenUtils } from "@shared/core";
import { getMeApi } from "./auth.api";
import { MeResponse } from "./auth.types";

/**
 * Hook cốt lõi, chỉ chịu trách nhiệm quản lý state `user`, `loading`
 * và hàm `fetchUser` để đồng bộ state từ server.
 */
export const useAuthCore = () => {
	const [user, setUser] = useState<MeResponse | null>(null);
	const [loading, setLoading] = useState(true);
	// isAuthorized có thể được tính toán từ `user`, không cần state riêng
	// Hoặc giữ lại nếu bạn có logic phức tạp

	const { showToast } = useNotification();

	const fetchUser = useCallback(async () => {
		try {
			const res = await getMeApi();
			if (res.success && res.data) {
				setUser(res.data);
			} else {
				tokenUtils.clearTokens();
				setUser(null);
			}
		} catch (error) {
			console.error("Fetch user failed:", error);
			tokenUtils.clearTokens();
			setUser(null);
		}
	}, [showToast]);

	return {
		user,
		setUser,
		loading,
		setLoading,
		fetchUser,
	};
};
