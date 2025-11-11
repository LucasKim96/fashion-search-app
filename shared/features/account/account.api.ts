// shared/features/account/account.api.ts
import { axiosInstance, ACCOUNT_ENDPOINTS } from "../../core";
import { ApiResponse } from "../../types/common.types";
import {
  Account,
  UpdateAccountBasicInfoRequest,
  UpdateRolesRequest,
  ModifyRolesRequest,
  AccountStatsByStatus,
  AccountStatsBanned,
  AccountStatsByRole,
} from "./account.types";

// --- GET ---
export const getAllAccounts = (): Promise<ApiResponse<Account[]>> => {
  return axiosInstance.get(ACCOUNT_ENDPOINTS.GET_ALL).then(res => res.data);
};

export const getAccountById = (id: string): Promise<ApiResponse<Account>> => {
  return axiosInstance.get(ACCOUNT_ENDPOINTS.BY_ID(id)).then(res => res.data);
};

export const getAccountsByStatus = (status: "active" | "inactive"): Promise<ApiResponse<Account[]>> => {
  return axiosInstance.get(ACCOUNT_ENDPOINTS.BY_STATUS(status)).then(res => res.data);
};

export const getAccountsByRole = (roleId: string): Promise<ApiResponse<Account[]>> => {
  return axiosInstance.get(ACCOUNT_ENDPOINTS.BY_ROLE(roleId)).then(res => res.data);
};

export const getBannedAccounts = (): Promise<ApiResponse<Account[]>> => {
  return axiosInstance.get(ACCOUNT_ENDPOINTS.BANNED).then(res => res.data);
};

export const getUnbannedAccounts = (): Promise<ApiResponse<Account[]>> => {
  return axiosInstance.get(ACCOUNT_ENDPOINTS.UNBANNED).then(res => res.data);
};

// --- PATCH / PUT ---
export const toggleBanAccount = (id: string): Promise<ApiResponse<Account>> => {
  return axiosInstance.patch(ACCOUNT_ENDPOINTS.TOGGLE_BAN(id)).then(res => res.data);
};

export const updateBasicInfo = (
  id: string,
  data: UpdateAccountBasicInfoRequest
): Promise<ApiResponse<Account>> => {
  return axiosInstance.put(ACCOUNT_ENDPOINTS.UPDATE_BASIC_INFO(id), data).then(res => res.data);
};

export const updateRoles = (id: string, data: UpdateRolesRequest): Promise<ApiResponse<Account>> => {
  return axiosInstance.put(ACCOUNT_ENDPOINTS.UPDATE_ROLES(id), data).then(res => res.data);
};

export const modifyRoles = (id: string, data: ModifyRolesRequest): Promise<ApiResponse<Account>> => {
  return axiosInstance.put(ACCOUNT_ENDPOINTS.MODIFY_ROLES(id), data).then(res => res.data);
};

// --- STATS ---
export const countAccountsByStatus = (): Promise<ApiResponse<AccountStatsByStatus>> => {
  return axiosInstance.get(ACCOUNT_ENDPOINTS.STATS_STATUS).then(res => res.data);
};

export const countBannedAccountsStats = (): Promise<ApiResponse<AccountStatsBanned>> => {
  return axiosInstance.get(ACCOUNT_ENDPOINTS.STATS_BANNED).then(res => res.data);
};

export const countAccountsByRole = (): Promise<ApiResponse<AccountStatsByRole[]>> => {
  return axiosInstance.get(ACCOUNT_ENDPOINTS.STATS_ROLE).then(res => res.data);
};

// --- SEARCH ---
export const searchAccounts = (keyword: string): Promise<ApiResponse<Account[]>> => {
  return axiosInstance.get(`${ACCOUNT_ENDPOINTS.SEARCH}?keyword=${keyword}`).then(res => res.data);
};