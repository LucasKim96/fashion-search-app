import { axiosInstance } from "../../core/api/axiosInstance";
import { ApiResponse } from "../../types/common.types";
import {
  Account,
  UpdateBasicInfoPayload,
  UpdateRolesPayload,
  ModifyRolesPayload,
  AccountStatsByStatus,
  AccountStatsByBanned,
  AccountStatsByRole,
} from "./account.types";


const BASE_URL = "/api/accounts";

// Lấy danh sách tài khoản
export const getAllAccounts = async () => {
  const res = await axiosInstance.get<ApiResponse<Account[]>>(BASE_URL);
  return res.data;
};

// Lấy tài khoản theo ID
export const getAccountById = async (id: string) => {
  const res = await axiosInstance.get<ApiResponse<Account>>(`${BASE_URL}/${id}`);
  return res.data;
};

// Lấy tài khoản theo trạng thái
export const getAccountsByStatus = async (status: string) => {
  const res = await axiosInstance.get<ApiResponse<Account[]>>(
    `${BASE_URL}/status/${status}`
  );
  return res.data;
};

// Lấy tài khoản theo vai trò
export const getAccountsByRole = async (roleId: string) => {
  const res = await axiosInstance.get<ApiResponse<Account[]>>(
    `${BASE_URL}/role/${roleId}`
  );
  return res.data;
};

// Lấy danh sách bị chặn
export const getBannedAccounts = async () => {
  const res = await axiosInstance.get<ApiResponse<Account[]>>(`${BASE_URL}/banned`);
  return res.data;
};

// Lấy danh sách không bị chặn
export const getUnbannedAccounts = async () => {
  const res = await axiosInstance.get<ApiResponse<Account[]>>(`${BASE_URL}/unbanned`);
  return res.data;
};

// Toggle khóa / mở khóa
export const toggleBanAccount = async (id: string) => {
  const res = await axiosInstance.put<ApiResponse<Account>>(
    `${BASE_URL}/ban-toggle/${id}`
  );
  return res.data;
};

// Cập nhật thông tin cơ bản
export const updateBasicInfo = async (id: string, payload: UpdateBasicInfoPayload) => {
  const res = await axiosInstance.put<ApiResponse<Account>>(
    `${BASE_URL}/update-basic/${id}`,
    payload
  );
  return res.data;
};

// Ghi đè toàn bộ role
export const updateRoles = async (id: string, payload: UpdateRolesPayload) => {
  const res = await axiosInstance.put<ApiResponse<Account>>(
    `${BASE_URL}/update-roles/${id}`,
    payload
  );
  return res.data;
};

// Thêm hoặc xóa role linh hoạt
export const modifyRoles = async (id: string, payload: ModifyRolesPayload) => {
  const res = await axiosInstance.put<ApiResponse<Account>>(
    `${BASE_URL}/modify-roles/${id}`,
    payload
  );
  return res.data;
};

// Thống kê theo trạng thái
export const countByStatus = async () => {
  const res = await axiosInstance.get<ApiResponse<AccountStatsByStatus>>(
    `${BASE_URL}/stats/status`
  );
  return res.data;
};

// Thống kê tài khoản bị khóa / không bị khóa
export const countBannedAccounts = async () => {
  const res = await axiosInstance.get<ApiResponse<AccountStatsByBanned>>(
    `${BASE_URL}/stats/banned`
  );
  return res.data;
};

// Thống kê theo vai trò
export const countByRole = async () => {
  const res = await axiosInstance.get<ApiResponse<AccountStatsByRole[]>>(
    `${BASE_URL}/stats/role`
  );
  return res.data;
};

// Tìm kiếm tài khoản
export const searchAccounts = async (keyword: string) => {
  const res = await axiosInstance.get<ApiResponse<Account[]>>(
    `${BASE_URL}/search`,
    { params: { keyword } }
  );
  return res.data;
};
