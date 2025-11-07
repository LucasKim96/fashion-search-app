"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginApi } from "./auth.api";
import { errorUtils } from "@shared/core/utils/error.utils";
import { useNotification } from "@shared/core/ui/NotificationProvider";

export const useLogin = (redirectPath = "/dashboard") => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useNotification();

  const handleLogin = async (usernameOrPhone: string, password: string) => {
    try {
      setLoading(true);

      const res = await loginApi({ usernameOrPhone, password });

      if (res.success) {
        showToast(res.message || "Đăng nhập thành công!", "success");
        router.push(redirectPath);
      } else {
        showToast(res.message || "Đăng nhập thất bại", "error");
      }
    } catch (error) {
      showToast(errorUtils.parseApiError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading };
};
