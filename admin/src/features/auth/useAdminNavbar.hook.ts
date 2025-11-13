"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@shared/features/auth";
import { 
  errorUtils, 
  extractUserDisplayInfo,
  useNotification,
} from "@shared/core/";

export const useAdminNavbar = () => {
  const router = useRouter();
  const { user: authUser, logout, refreshUser } = useAuth();
  const { showToast } = useNotification();

  const [userInfo, setUserInfo] = useState<ReturnType<typeof extractUserDisplayInfo>>({});

  // ====== Cập nhật user info khi authUser thay đổi ======
  const fetchUserInfo = useCallback(() => {
    try {
      if (authUser) setUserInfo(extractUserDisplayInfo(authUser));
    } catch (error) {
      showToast(errorUtils.parseApiError(error), "error");
    }
  }, [authUser, showToast]);

  useEffect(() => {
    fetchUserInfo();
    refreshUser();
    // console.log("authUser:", authUser);
    // console.log("extractUserDisplayInfo:", extractUserDisplayInfo(authUser));
  }, [authUser, fetchUserInfo]);

  // ====== Xử lý click account ======
  const handleAccountClick = () => router.push("/admin/profile");

  // ====== Đăng xuất ======
  const handleLogout = async () => {
    try {
      const res = await logout();
      if (res?.success) {
        showToast(res.message || "Đăng xuất thành công!", "success");
      } else {
        showToast(res?.message || "Đăng xuất thất bại!", "error");
      }
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