export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

export const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  VERIFY: "/auth/verify",
  CHANGE_PASSWORD: "/auth/change-password",
  ME: "/auth/me",
  LOGOUT: "/auth/logout",
};

export const USER_ENDPOINTS = {
  GET_ALL: "/users",
  BY_ID: (id: string) => `/users/${id}`,
  BY_EMAIL: (email: string) => `/users/email/${email}`,
  UPDATE_BASIC_INFO: (id: string) => `/users/basic-info/${id}`,
  UPDATE_AVATAR: (id: string) => `/users/avatar/${id}`,
  UPDATE_DEFAULT_AVATAR: "/users/default-avatar",
  SEARCH: (keyword: string) => `/users/search?keyword=${keyword}`,
  STATS_GENDER: "/users/stats/gender",
  STATS_AGE: "/users/stats/age",
};

export const ACCOUNT_ENDPOINTS = {
  GET_ALL: "/accounts",
  BY_STATUS: (status: string) => `/accounts/status/${status}`,      // active / inactive
  BY_ROLE: (roleId: string) => `/accounts/role/${roleId}`,
  BANNED: "/accounts/banned",
  UNBANNED: "/accounts/unbanned",
  TOGGLE_BAN: (id: string) => `/accounts/ban-toggle/${id}`,
  UPDATE_ROLES: (id: string) => `/accounts/update-roles/${id}`,
  MODIFY_ROLES: (id: string) => `/accounts/modify-roles/${id}`,
  STATS_STATUS: "/accounts/stats/status",
  STATS_BANNED: "/accounts/stats/banned",
  STATS_ROLE: "/accounts/stats/role",
  SEARCH: "/accounts/search",
  UPDATE_BASIC_INFO: (id: string) => `/accounts/update-basic/${id}`,
  BY_ID: (id: string) => `/accounts/${id}`,
};

export const SHOP_ENDPOINTS = {
	GET_ALL: "/shops",
	BY_ID: (id: string) => `/shops/${id}`,
	CREATE: "/shops/owner",
	UPDATE: (id: string) => `/shops/owner/${id}`,
	DELETE: (id: string) => `/shops/owner/${id}`,
	CHANGE_STATUS: (id: string) => `/shops/owner/${id}/status`,
	UPDATE_LOGO: (id: string) => `/shops/owner/${id}/logo`,
	UPDATE_COVER: (id: string) => `/shops/owner/${id}/cover`,
	RESTORE: (id: string) => `/shops/admin//${id}/restore`,
	UPDATE_DEFAULT_LOGO: "/shops/admin/default-logo",
	UPDATE_DEFAULT_COVER: "/shops/admin/default-cover",
	CLEANUP_NULL: "/shops/admin/cleanup/null-accounts",
};
