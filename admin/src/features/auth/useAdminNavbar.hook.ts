"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@shared/features/auth/useAuth";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { getRoleLabel, mapBackendRole } from "@shared/core/utils/role.utils";
import { errorUtils } from "@shared/core/utils/error.utils";

export const useAdminNavbar = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useNotification();

  const handleAccountClick = () => router.push("/account");

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

  // Lấy role đầu tiên (nếu có) và map về RoleKey
  const firstRole = user?.roles?.[0];
  const roleKey = firstRole ? mapBackendRole(firstRole) : undefined;
  const roleLabel = getRoleLabel(roleKey);

  return { user, roleLabel, handleAccountClick, handleLogout };
};
