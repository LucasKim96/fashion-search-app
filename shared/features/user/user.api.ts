// shared/features/user/user.api.ts
import { axiosInstance } from "../../core";
import {
  UserInfo,
  UserStatsAgeRange,
  UserStatsGender,
} from "./user.types";

const BASE_URL = "/api/users";

export const UserAPI = {
  getAll: async (): Promise<UserInfo[]> => {
    const res = await axiosInstance.get(BASE_URL);
    return res.data.data;
  },

  getById: async (id: string): Promise<UserInfo> => {
    const res = await axiosInstance.get(`${BASE_URL}/${id}`);
    return res.data.data;
  },

  getByEmail: async (email: string): Promise<UserInfo> => {
    const res = await axiosInstance.get(`${BASE_URL}/email/${email}`);
    return res.data.data;
  },

  updateBasicInfo: async (
    id: string,
    payload: Partial<UserInfo>
  ): Promise<UserInfo> => {
    const res = await axiosInstance.put(`${BASE_URL}/basic-info/${id}`, payload);
    return res.data.data;
  },

  updateAvatar: async (id: string, file: File): Promise<UserInfo> => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await axiosInstance.put(`${BASE_URL}/avatar/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  updateDefaultAvatar: async (file: File): Promise<{ defaultAvatar: string }> => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await axiosInstance.put(`${BASE_URL}/default-avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  search: async (keyword: string): Promise<UserInfo[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/search?keyword=${keyword}`);
    return res.data.data;
  },

  statsByGender: async (): Promise<UserStatsGender[]> => {
    const res = await axiosInstance.get(`${BASE_URL}/stats/gender`);
    return res.data.data;
  },

  statsByAgeRange: async (): Promise<UserStatsAgeRange> => {
    const res = await axiosInstance.get(`${BASE_URL}/stats/age`);
    return res.data.data;
  },
};
