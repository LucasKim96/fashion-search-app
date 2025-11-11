// shared/features/account/account.types.ts
import { Role } from "../role/role.types";
import { UserInfo } from "../user/user.types";

export interface Account {
  _id: string;
  username: string;
  phoneNumber: string;
  // password?: string;
  status: "active" | "inactive";
  isBanned: boolean;
  roles: Role[];
  userInfoId?: UserInfo | string;
  lastActiveVN?: string; // từ backend tính sẵn
  lastActive?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Payload để update thông tin cơ bản */
export interface UpdateAccountBasicInfoRequest {
  username?: string;
  phoneNumber?: string;
}

/** Payload để update roles (ghi đè) */
export interface UpdateRolesRequest {
  roleIds: string[];
}

/** Payload để modify roles (thêm / xóa) */
export interface ModifyRolesRequest {
  roleIds: string[];
  action: "add" | "remove";
}

/** Thống kê tài khoản theo trạng thái */
export interface AccountStatsByStatus {
  [status: string]: number; // ví dụ: { active: 10, inactive: 5 }
}

/** Thống kê tài khoản bị khóa / không khóa */
export interface AccountStatsBanned {
  banned: number;
  unbanned: number;
}

/** Thống kê tài khoản theo role */
export interface AccountStatsByRole {
  roleName: string;
  count: number;
}