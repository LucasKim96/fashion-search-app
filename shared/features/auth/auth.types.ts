import { Account } from "../account"

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginResponse {
  account: Account;
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse extends Account {}

export interface RegisterRequest {
  username: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  usernameOrPhone: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
