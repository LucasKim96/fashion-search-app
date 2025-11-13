import { Account } from "@shared/features/account/account.types";
import { mapBackendRoles } from "./role.utils";
import { RoleKey } from "../constants/role.constants";
import { buildImageUrl } from "./image.utils";

export interface UserProfile {
    // ===== Account info =====
    accountId: string;
    username: string;
    phoneNumber: string;
    status: Account["status"];
    isBanned: boolean;
    createdAt?: string;
    updatedAt?: string;
    lastActive?: string | null;
    lastActiveVN?: string | null;

    // ===== UserInfo =====
    userId?: string; // _id của UserInfo
    name?: string;
    email?: string;
    avatar?: string;
    avatarUrl?: string;
    dayOfBirth?: string | null;
    gender?: "male" | "female" | "other";

    // ===== Roles =====
    roles: RoleKey[];
}

/**
 * Chuyển từ Account API response sang UserProfile dùng frontend
 * @param account object Account từ backend
 */
export const parseUserProfile = (account: Account): UserProfile => {
    const userInfo = typeof account.userInfoId === "object" ? account.userInfoId : undefined;

    return {
        accountId: account._id,
        username: account.username,
        phoneNumber: account.phoneNumber,
        status: account.status,
        isBanned: account.isBanned,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        lastActive: account.lastActive || null,
        lastActiveVN: account.lastActiveVN || null,

        // UserInfo
        userId: userInfo?._id,
        name: userInfo?.name,
        email: userInfo?.email,
        avatar: userInfo?.avatar,
        avatarUrl: buildImageUrl(userInfo?.avatar),
        dayOfBirth: userInfo?.dayOfBirth,
        gender: userInfo?.gender,

        // Roles
        roles: mapBackendRoles(account.roles),
    };
};
