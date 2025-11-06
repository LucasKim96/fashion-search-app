// shared/features/auth/useAuth.ts
import { useEffect, useState, useCallback } from "react";
import { tokenUtils } from "@shared/core";
import { getMeApi, refreshTokenApi } from "./auth.api";
import { MeResponse } from "./auth.types";
import { RoleKey } from "@shared/core/constants/role.constants";
import { mapBackendRoles } from "@shared/core/utils/role.utils";

interface UseAuthOptions {
  requiredRole?: RoleKey | RoleKey[]; // nếu muốn check quyền
}

export const useAuth = ({ requiredRole }: UseAuthOptions = {}) => {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await getMeApi();
      if (res.success && res.data) {
        setUser(res.data);

        if (requiredRole) {
          const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          const userRoles = mapBackendRoles(res.data.roles || []);
          const hasRole = userRoles.some(r => rolesArray.includes(r));
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
      tokenUtils.clearTokens();
      setUser(null);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [requiredRole]);

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
    } catch {
      tokenUtils.clearTokens();
      setUser(null);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

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

  return { user, loading, isAuthenticated: !!user, isAuthorized, refreshUser: fetchUser, handleRefreshToken };
};
