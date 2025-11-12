// shared/core/utils/profile.utils.ts
import { Account } from "@shared/features/account/account.types";
import { mapBackendRoles } from "./role.utils";
import { RoleKey } from "../constants/role.constants";
import { buildImageUrl } from "./image.utils";

export interface UserProfile {
  id: string;
  username: string;
  phoneNumber: string;
  status: Account["status"];
  isBanned: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastActive?: string | null;
  lastActiveVN?: string | null;

  // UserInfo
  name?: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
  dayOfBirth?: string | null;
  gender?: "male" | "female" | "other";

  // Roles
  roles: RoleKey[];
}

export const parseUserProfile = (account: Account): UserProfile => {
  const userInfo =
    typeof account.userInfoId === "object" ? account.userInfoId : undefined;

  // Avatar mặc định từ server nếu không có
  const avatarPath = userInfo?.avatar || "/assets/avatars/default-avatar.jpg";

  return {
    id: account._id,
    username: account.username,
    phoneNumber: account.phoneNumber,
    status: account.status,
    isBanned: account.isBanned,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    lastActive: account.lastActive || null,
    lastActiveVN: account.lastActiveVN || null,

    // UserInfo
    name: userInfo?.name,
    email: userInfo?.email,
    avatar: userInfo?.avatar,
    avatarUrl: buildImageUrl(avatarPath), // dùng buildImageUrl luôn
    dayOfBirth: userInfo?.dayOfBirth,
    gender: userInfo?.gender,

    // Roles
    roles: mapBackendRoles(account.roles),
  };
};
