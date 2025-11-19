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
  GET_ROLES: "/accounts/roles",
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


export const ATTRIBUTE_ENDPOINTS = {
  // ----- Public -----
  PUBLIC_BY_ID: (id: string) => `/attributes/${id}`,

  // ----- Admin -----
  ADMIN_LIST: "/attributes/admin",
  ADMIN_SEARCH: "/attributes/admin/search",
  ADMIN_CREATE: "/attributes/admin",
  ADMIN_UPDATE_LABEL: (id: string) => `/attributes/admin/label/${id}`,
  ADMIN_DELETE: (id: string) => `/attributes/admin/${id}`,
  ADMIN_TOGGLE: (id: string) => `/attributes/admin/toggle/${id}`,
  // ----- Shop -----
  SHOP_LIST: "/attributes/shop",
  SHOP_SEARCH: "/attributes/shop/search",
  SHOP_CREATE: "/attributes/shop",
  SHOP_AVAILABLE_LIST: "/attributes/shop/available",           // lấy danh sách attribute khả dụng
  SHOP_AVAILABLE_BY_ID: (id: string) => `/attributes/shop/available/${id}`, // lấy chi tiết attribute khả dụng theo id
  SHOP_UPDATE_LABEL: (id: string) => `/attributes/shop/label/${id}`,
  SHOP_DELETE: (id: string) => `/attributes/shop/${id}`,
  SHOP_TOGGLE: (id: string) => `/attributes/shop/toggle/${id}`,
};

export const ATTRIBUTE_VALUE_ENDPOINTS = {
  // ----- Admin -----
  ADMIN_CREATE: (attributeId: string) => `/attribute-values/admin/${attributeId}`,
  ADMIN_UPDATE: (valueId: string) => `/attribute-values/admin/${valueId}`,
  ADMIN_TOGGLE: (valueId: string) => `/attribute-values/admin/toggle/${valueId}`,
  ADMIN_DELETE: (valueId: string) => `/attribute-values/admin/${valueId}`,

  // ----- Shop -----
  SHOP_CREATE: (attributeId: string) => `/attribute-values/shop/${attributeId}`,
  SHOP_UPDATE: (valueId: string) => `/attribute-values/shop/${valueId}`,
  SHOP_TOGGLE: (valueId: string) => `/attribute-values/shop/toggle/${valueId}`,
  SHOP_DELETE: (valueId: string) => `/attribute-values/shop/${valueId}`,
};

export const PRODUCT_ENDPOINTS = {
  // ----- Public -----
  PUBLIC_LIST: "/products",
  PUBLIC_LIST_BY_SHOP: "/products/shop",
  PUBLIC_DETAIL: (productId: string) => `/products/${productId}`,
  PUBLIC_COUNT_SHOP: (shopId: string) => `/products/count/${shopId}`,

  // ----- Admin -----
  ADMIN_LIST: "/products/admin",
  ADMIN_COUNT: "/products/admin/count",
  ADMIN_DETAIL: (productId: string) => `/products/admin/${productId}`,
  ADMIN_TOGGLE: (productId: string) => `/products/admin/toggle/${productId}`,
  ADMIN_DELETE: (productId: string) => `/products/admin/${productId}`,
  ADMIN_SEARCH: "/products/admin/search",
  // ----- Shop -----
  SHOP_LIST: "/products/shop",
  SHOP_COUNT: "/products/shop/count",
  SHOP_CREATE: "/products/shop/create",
  SHOP_UPDATE_BASIC: (productId: string) => `/products/shop/basic/${productId}`,
  SHOP_UPDATE_IMAGES: (productId: string) => `/products/shop/images/${productId}`,
  SHOP_TOGGLE: (productId: string) => `/products/shop/toggle/${productId}`,
  SHOP_SEARCH: "/products/shop/search",
  SHOP_DELETE: (productId: string) => `/products/shop/${productId}`,
};

export const PRODUCT_VARIANT_ENDPOINTS = {
  GENERATE: "/product-variants/generate",
  GENERATE_NEW: "/product-variants/generate-new",
  GET_ATTRIBUTES: (productId: string) => `/product-variants/attributes/${productId}`,
  BULK_CREATE: "/product-variants/bulk",
  UPDATE: (variantId: string) => `/product-variants/${variantId}`,
};