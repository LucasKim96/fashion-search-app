// shared/features/account/account.types.ts
import { Role } from "../role/role.types";
import { UserInfo } from "../user/user.types";

export interface Account {
  _id: string;
  username: string;
  phoneNumber: string;
  password?: string;
  status: "active" | "inactive";
  lastActive?: string | null;
  isBanned: boolean;
  roles: Role[];
  userInfoId?: UserInfo | string;
  createdAt?: string;
  updatedAt?: string;
  lastActiveVN?: string; // từ backend tính sẵn
}

export interface AccountStatsByStatus {
  active: number;
  inactive: number;
}

export interface AccountStatsByBanned {
  banned: number;
  unbanned: number;
}

export interface AccountStatsByRole {
  roleName: string;
  count: number;
}

export interface UpdateBasicInfoPayload {
  username?: string;
  phoneNumber?: string;
}

export interface UpdateRolesPayload {
  roleIds: string[];
}

export interface ModifyRolesPayload {
  roleIds: string[];
  action: "add" | "remove";
}

