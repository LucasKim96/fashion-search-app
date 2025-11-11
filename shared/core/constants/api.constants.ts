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