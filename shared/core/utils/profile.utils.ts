import { Account } from "@shared/features/account/account.types";
import { mapBackendRoles } from "./role.utils";
import { RoleKey, ROLES } from "../constants/role.constants";
import { buildImageUrl } from "./image.utils";

export type ProfileContext = "CLIENT" | "SELLER" | "ADMIN";

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
	roleLabel: string;
}

// const getHighestPriorityRoleLabel = (roles: RoleKey[]): string => {
// 	if (!roles || roles.length === 0) {
// 		return "Thành viên"; // Fallback nếu user không có role nào
// 	}

// 	// Tìm vai trò có level cao nhất
// 	const highestRole = roles.reduce((highest, currentRoleKey) => {
// 		const highestRoleInfo = ROLES[highest];
// 		const currentRoleInfo = ROLES[currentRoleKey];

// 		// Nếu level của role hiện tại cao hơn level của role cao nhất đã tìm thấy
// 		if (
// 			currentRoleInfo &&
// 			highestRoleInfo &&
// 			currentRoleInfo.level > highestRoleInfo.level
// 		) {
// 			return currentRoleKey; // Thì role hiện tại trở thành role cao nhất mới
// 		}

// 		return highest; // Nếu không thì vẫn giữ role cao nhất cũ
// 	}, roles[0]); // Bắt đầu so sánh với vai trò đầu tiên trong mảng

// 	// Trả về thuộc tính `roleName` của vai trò cao nhất đã tìm được
// 	return ROLES[highestRole]?.roleName || "Thành viên";
// };

const getHighestPriorityRoleLabel = (
	roles: RoleKey[],
	context: ProfileContext = "CLIENT" // Mặc định là 'CLIENT'
): string => {
	if (!roles || roles.length === 0) {
		return "Thành viên";
	}

	// Ưu tiên đặc biệt cho ngữ cảnh SELLER
	if (context === "SELLER" && roles.includes("SHOP_OWNER")) {
		return ROLES.SHOP_OWNER.roleName; // Luôn hiển thị "Chủ shop"
	}

	// Logic cũ: Tìm vai trò có level cao nhất
	const highestRoleKey = roles.reduce((highest, currentRoleKey) => {
		const highestRoleInfo = ROLES[highest];
		const currentRoleInfo = ROLES[currentRoleKey];

		if (
			currentRoleInfo &&
			highestRoleInfo &&
			currentRoleInfo.level > highestRoleInfo.level
		) {
			return currentRoleKey;
		}

		return highest;
	}, roles[0]);

	return ROLES[highestRoleKey]?.roleName || "Thành viên";
};

/**
 * Chuyển từ Account API response sang UserProfile dùng frontend
 * @param account object Account từ backend
 */
export const parseUserProfile = (
	account: Account,
	context: ProfileContext = "CLIENT"
): UserProfile => {
	const userInfo =
		typeof account.userInfoId === "object" ? account.userInfoId : undefined;
	const mappedRoleKeys = mapBackendRoles(account.roles);

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
		roles: mappedRoleKeys,
		roleLabel: getHighestPriorityRoleLabel(mappedRoleKeys, context),
	};
};
