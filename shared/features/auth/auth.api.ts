import { axiosInstance, tokenUtils, AUTH_ENDPOINTS } from "../../core";
import { ApiResponse } from "../../types/common.types";
import {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  MeResponse,
} from "./auth.types";

// Đăng ký
export const registerApi = (data: RegisterRequest) =>
  axiosInstance.post<ApiResponse>(AUTH_ENDPOINTS.REGISTER, data).then((res) => res.data);

// Đăng nhập
export const loginApi = async (data: LoginRequest) => {
  const res = await axiosInstance.post<ApiResponse<LoginResponse>>(AUTH_ENDPOINTS.LOGIN, data);
  const responseData = res.data.data;
  if (!responseData) throw new Error("Không có dữ liệu đăng nhập từ server");
  tokenUtils.setTokens(responseData.accessToken, responseData.refreshToken);
  return res.data;
};


// Đăng xuất
export const logoutApi = async () => {
  const res = await axiosInstance.post<ApiResponse>(AUTH_ENDPOINTS.LOGOUT);
  tokenUtils.clearTokens();
  return res.data;
};

// Làm mới access token bằng refresh token
export const refreshTokenApi = (refreshToken: string) =>
  axiosInstance.post<ApiResponse<{ accessToken: string }>>(AUTH_ENDPOINTS.REFRESH, { refreshToken })
    .then((res) => res.data)
    .then((data) => {
      if (data.success && data.data?.accessToken) {
        tokenUtils.setTokens(data.data.accessToken, refreshToken || undefined);
      }
      return data;
    });


// Lấy thông tin người dùng
export const getMeApi = () =>
  axiosInstance.get<ApiResponse<MeResponse>>(AUTH_ENDPOINTS.ME).then((res) => res.data);

// Đổi mật khẩu
export const changePasswordApi = (data: ChangePasswordRequest) =>
  axiosInstance.post<ApiResponse>(AUTH_ENDPOINTS.CHANGE_PASSWORD, data).then((res) => res.data);

// Xác minh token
export const verifyTokenApi = () =>
  axiosInstance.post<ApiResponse>(AUTH_ENDPOINTS.VERIFY).then((res) => res.data);
