// shared/features/user/user.api.ts
import { axiosInstance, USER_ENDPOINTS } from "../../core";
import { ApiResponse } from "../../types/common.types";
import {
  UserInfo,
  UserStatsGender,
  UserStatsAgeRange,
  DefaultAvatarResponse,
  UpdateUserBasicInfoRequest,
  UploadAvatarResponse,
} from "./user.types";

/** Lấy tất cả user */
export const getAllUsersApi = async (): Promise<ApiResponse<UserInfo[]>> => {
  const res = await axiosInstance.get<ApiResponse<UserInfo[]>>(USER_ENDPOINTS.GET_ALL);
  return res.data;
};

/** Lấy user theo id */
export const getUserByIdApi = async (id: string): Promise<ApiResponse<UserInfo>> => {
  const res = await axiosInstance.get<ApiResponse<UserInfo>>(USER_ENDPOINTS.BY_ID(id));
  return res.data;
};

/** Lấy user theo email */
export const getUserByEmailApi = async (email: string): Promise<ApiResponse<UserInfo>> => {
  const res = await axiosInstance.get<ApiResponse<UserInfo>>(USER_ENDPOINTS.BY_EMAIL(email));
  return res.data;
};

/** Cập nhật thông tin cơ bản */
export const updateUserBasicInfoApi = async (
  id: string,
  payload: UpdateUserBasicInfoRequest
): Promise<ApiResponse<UserInfo>> => {
  const res = await axiosInstance.put<ApiResponse<UserInfo>>(
    USER_ENDPOINTS.UPDATE_BASIC_INFO(id),
    payload
  );
  return res.data;
};

/** Cập nhật avatar user */
export const updateUserAvatarApi = async (
  id: string,
  file: File
): Promise<ApiResponse<UploadAvatarResponse>> => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await axiosInstance.put<ApiResponse<UploadAvatarResponse>>(
    USER_ENDPOINTS.UPDATE_AVATAR(id),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};

/** Cập nhật avatar mặc định */
export const updateDefaultAvatarApi = async (
  file: File
): Promise<ApiResponse<DefaultAvatarResponse>> => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await axiosInstance.put<ApiResponse<DefaultAvatarResponse>>(
    USER_ENDPOINTS.UPDATE_DEFAULT_AVATAR,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};

/** Tìm kiếm user */
export const searchUsersApi = async (keyword: string): Promise<ApiResponse<UserInfo[]>> => {
  const res = await axiosInstance.get<ApiResponse<UserInfo[]>>(USER_ENDPOINTS.SEARCH(keyword));
  return res.data;
};

/** Thống kê theo giới tính */
export const statsByGenderApi = async (): Promise<ApiResponse<UserStatsGender[]>> => {
  const res = await axiosInstance.get<ApiResponse<UserStatsGender[]>>(USER_ENDPOINTS.STATS_GENDER);
  return res.data;
};

/** Thống kê theo độ tuổi */
export const statsByAgeRangeApi = async (): Promise<ApiResponse<UserStatsAgeRange>> => {
  const res = await axiosInstance.get<ApiResponse<UserStatsAgeRange>>(USER_ENDPOINTS.STATS_AGE);
  return res.data;
};
