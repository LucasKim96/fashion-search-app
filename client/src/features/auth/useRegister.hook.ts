"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import { errorUtils } from "@shared/core/utils/error.utils";

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (data: {
    username: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      setLoading(true);
      const res = await AuthService.register(data);
      if (res.success) {
        alert("Đăng ký thành công!");
        router.push("/login");
      } else {
        alert(res.message || "Đăng ký thất bại");
      }
    } catch (error) {
      alert(errorUtils.parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return { handleRegister, loading };
};
