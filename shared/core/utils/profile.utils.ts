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
/**
 * HÀM 1: Lấy vai trò tương ứng với ngữ cảnh hiện tại.
 * @param roles - Mảng các vai trò của người dùng
 * @param context - Ngữ cảnh hiện tại (CLIENT, SELLER, ADMIN)
 * @returns Nhãn vai trò cho ngữ cảnh đó.
 */
const getContextRoleLabel = (
	roles: RoleKey[],
	context: ProfileContext
): string => {
	if (!roles || roles.length === 0) return "Thành viên";

	switch (context) {
		case "SELLER":
			if (roles.includes("SHOP_OWNER")) return ROLES.SHOP_OWNER.roleName;
			// Fallback nếu user vào trang seller mà không phải chủ shop
			return getHighestRoleLabel(roles);
		case "ADMIN":
			if (roles.includes("ADMIN")) return ROLES.ADMIN.roleName;
			if (roles.includes("SUPER_ADMIN")) return ROLES.SUPER_ADMIN.roleName;
			// Fallback nếu user vào trang admin mà không có quyền
			return getHighestRoleLabel(roles);
		case "CLIENT":
		default:
			// Ở trang client, luôn hiển thị là Khách hàng nếu họ có vai trò này
			if (roles.includes("CUSTOMER")) return ROLES.CUSTOMER.roleName;
			// Fallback nếu không có vai trò khách hàng
			return "Thành viên";
	}
};

/**
 * HÀM 2: Lấy vai trò có level cao nhất.
 * @param roles - Mảng các vai trò của người dùng
 * @returns Nhãn vai trò có level cao nhất.
 */
export const getHighestRoleLabel = (roles: RoleKey[]): string => {
	if (!roles || roles.length === 0) return "Thành viên";

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
 * Hàm chính: Chuyển từ Account API response sang UserProfile.
 * Sẽ sử dụng `getContextRoleLabel` làm mặc định.
 * @param account object Account từ backend
 * @param context Ngữ cảnh hiện tại để quyết định roleLabel mặc định
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
		roleLabel: getContextRoleLabel(mappedRoleKeys, context),
	};
};
