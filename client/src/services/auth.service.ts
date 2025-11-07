import {
  loginApi,
  registerApi,
  logoutApi,
  getMeApi,
  refreshTokenApi,
} from "@shared/features/auth/auth.api";
import { LoginRequest, RegisterRequest } from "@shared/features/auth/auth.types";

export const AuthService = {
  login: (data: LoginRequest) => loginApi(data),
  register: (data: RegisterRequest) => registerApi(data),
  logout: () => logoutApi(),
  getMe: () => getMeApi(),
  refreshToken: (token: string) => refreshTokenApi(token),
};
