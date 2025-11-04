export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },
  PRODUCT: {
    BASE: "/products",
    DETAIL: (id: string) => `/products/${id}`,
  },
  ORDER: {
    BASE: "/orders",
  },
};
