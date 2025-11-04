import { apiClient } from "../../api/apiClient";
import { API_ENDPOINTS } from "../../constants/endpoints";
import { setAccessToken } from "../../utils/token";
import { storage } from "../../utils/storage";

// ==== Kiểu dữ liệu trả về từ API ====
interface LoginResponse {
  token: string;
  user: any;
}

interface ProfileResponse {
  user: any;
}

export const AuthService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
    if (data?.token) {
      setAccessToken(data.token);
      storage.set("user_info", data.user);
    }
    return data;
  },

  register: async (body: any): Promise<any> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, body);
    return data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const { data } = await apiClient.get<ProfileResponse>(API_ENDPOINTS.AUTH.PROFILE);
    return data;
  },
};
