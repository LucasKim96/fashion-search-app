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
    console.log("authUser:", authUser);
    console.log("extractUserDisplayInfo:", extractUserDisplayInfo(authUser));
  }, [authUser, fetchUserInfo]);

  // ====== Xử lý click account ======
  const handleAccountClick = () => router.push("/admin/account");

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


// export const useAdminNavbar = () => {
//   const router = useRouter();
//   const { user, logout } = useAuth();
//   const { showToast } = useNotification();

//   const handleAccountClick = () => router.push("/admin/account");

//   const handleLogout = async () => {
//     try {
//       const res = await logout();
//       if (res?.success) {
//         showToast(res.message || "Đăng xuất thành công!", "success");
//       } else {
//         showToast(res?.message || "Đăng xuất thất bại!", "error");
//       }
//     } catch (error) {
//       showToast(errorUtils.parseApiError(error), "error");
//     } finally {
//       router.push("/login");
//     }
//   };

//   // Lấy role đầu tiên (nếu có) và map về RoleKey
//   const firstRole = user?.roles?.[0];
//   const roleKey = firstRole ? mapBackendRole(firstRole) : undefined;
//   const roleLabel = getRoleLabel(roleKey);

//   return { user, roleLabel, handleAccountClick, handleLogout };
// };
