// shared/features/auth/ProtectedRoute.tsx
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "./useAuth";
import { RoleKey } from "@shared/core";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: RoleKey | RoleKey[];
  redirectTo?: string; // page redirect khi chưa auth hoặc không có quyền
}

export const ProtectedRoute = ({
  children,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const { user, loading, isAuthenticated, isAuthorized } = useAuth({ requiredRole });
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
    return <div>Loading...</div>; // Hoặc skeleton/loading spinner
  }

  if (!isAuthenticated || !isAuthorized) {
    return null; // Chờ redirect
  }

  return <>{children}</>;
};
