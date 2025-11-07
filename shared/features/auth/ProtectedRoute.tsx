"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { RoleKey } from "@shared/core";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: RoleKey | RoleKey[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const { loading, isAuthenticated, isAuthorized } = useAuth({ requiredRole });
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Chưa đăng nhập hoặc không có quyền
      if (!isAuthenticated || !isAuthorized) {
        router.replace(redirectTo);
      }
    }
  }, [loading, isAuthenticated, isAuthorized, router, redirectTo]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  if (!isAuthenticated || !isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
