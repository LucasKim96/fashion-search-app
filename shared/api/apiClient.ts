import axios from "axios";
import { getAccessToken, clearAuthData } from "../utils/token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// === Interceptors =================================================

// Gắn token trước khi gửi request
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});



// Xử lý lỗi 401 → logout toàn cục
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearAuthData();
      if (typeof window !== "undefined") {
        window.location.href = "/dang-nhap";
      }
    }
    return Promise.reject(err);
  }
);
