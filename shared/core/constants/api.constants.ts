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
