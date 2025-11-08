"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { tokenUtils } from "@shared/core";
import { errorUtils } from "@shared/core/utils/error.utils";
import { getMeApi, refreshTokenApi, logoutApi, loginApi } from "./auth.api";
import { MeResponse } from "./auth.types";
import { RoleKey } from "@shared/core/constants/role.constants";
import { mapBackendRoles } from "@shared/core/utils/role.utils";

interface UseAuthManagerOptions {
  requiredRole?: RoleKey | RoleKey[];
  redirectAfterLogin?: string;
  redirectAfterLogout?: string;
}

export const useAuth = ({
  requiredRole,
  redirectAfterLogin = "/dashboard",
  redirectAfterLogout = "/login",
}: UseAuthManagerOptions = {}) => {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const router = useRouter();
  const { showToast } = useNotification();

  // Lấy thông tin user hiện tại
  const fetchUser = useCallback(async () => {
    try {
      const res = await getMeApi();
      if (res.success && res.data) {
        setUser(res.data);

        if (requiredRole) {
          const rolesArray = Array.isArray(requiredRole)
            ? requiredRole
            : [requiredRole];
          const userRoles = mapBackendRoles(res.data.roles || []);
          const hasRole = userRoles.some((r) => rolesArray.includes(r));
          setIsAuthorized(hasRole);
        } else {
          setIsAuthorized(true);
        }
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
  }, [requiredRole, showToast]);

  // Đăng nhập
  const login = useCallback(
    async (usernameOrPhone: string, password: string) => {
      setLoading(true);
      try {
        const res = await loginApi({ usernameOrPhone, password });

        if (res.success) {
          showToast(res.message || "Đăng nhập thành công!", "success");
          await fetchUser(); // tải thông tin user
          router.push(redirectAfterLogin);
        } else {
          // Nếu BE trả success: false
          showToast(res.message || "Đăng nhập thất bại", "error");
        }

        return res;
      } catch (error) {
        // // --- Debug chi tiết lỗi ---
        // console.log("=== 🧩 Axios error object ===", error);
        // console.log("=== 📦 error.response ===", (error as any)?.response);
        // console.log("=== 🧾 error.response.data ===", (error as any)?.response?.data);
        // console.log("=== ⚠️ error.message ===", (error as any)?.message);
        const message = errorUtils.parseApiError(error);
        console.log("=== 💬 Parsed error message ===", message);
        showToast(message, "error");

        return {
          success: false,
          message,
          data: null,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchUser, router, redirectAfterLogin, showToast]
  );

  // Làm mới token
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

  // Đăng xuất
  const logout = useCallback(async () => {
    try {
      const res = await logoutApi();
      if (res.success) {
        showToast(res.message || "Đăng xuất thành công", "success");
      } else {
        showToast(res.message || "Đăng xuất thất bại", "error");
      }
      router.push(redirectAfterLogout);
      return res;
    } catch (error) {
      const message = errorUtils.parseApiError(error);
      showToast(message, "error");
      return {
        success: false,
        message,
        data: null,
      };
    } finally {
      tokenUtils.clearTokens();
      setUser(null);
      setIsAuthorized(false);
    }
  }, [router, redirectAfterLogout, showToast]);

  // Khi load app — kiểm tra user
  useEffect(() => {
    const token = tokenUtils.getAccessToken();
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
      setUser(null);
      setIsAuthorized(false);
    }
  }, [fetchUser]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAuthorized,
    login,
    logout,
    refreshUser: fetchUser,
    handleRefreshToken,
  };
};
