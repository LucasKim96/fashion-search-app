"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { tokenUtils, mapBackendRoles, RoleKey, errorUtils, useNotification } from "@shared/core";
import { MeResponse, RegisterRequest, ChangePasswordRequest } from "./auth.types";
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

  // ====== Helper: chạy API và tự động fetch lại user ======
  const runAndRefreshUser = useCallback(
    async <T,>(apiCall: () => Promise<{ success: boolean; message?: string; data?: T }>) => {
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
          await fetchUser(); // tải thông tin user
          router.push(redirectAfterLogin);
        } else {
          showToast(res.message || "Đăng nhập thất bại", "error");
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
    [fetchUser, router, redirectAfterLogin, showToast]
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
      return { success: false, message, data: null };
    } finally {
      tokenUtils.clearTokens();
      setUser(null);
      setIsAuthorized(false);
    }
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
    register,
    logout,
    changePassword,
    verifyToken,
    refreshUser: fetchUser,
    handleRefreshToken,
  };
};
