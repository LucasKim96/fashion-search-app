import { ROLES, RoleKey, RoleType } from "../constants/role.constants";
import { Role as BackendRole } from "@shared/features/role/role.types";

/** Chuyển từ roleName backend sang RoleKey */
export const roleNameToKey = (roleName?: string): RoleKey | undefined => {
  if (!roleName) return undefined;
  const entry = Object.entries(ROLES).find(([, v]) => v.roleName === roleName);
  return entry ? (entry[0] as RoleKey) : undefined;
};

/** Chuyển 1 role backend sang RoleKey */
export const mapBackendRole = (role: BackendRole): RoleKey | undefined => {
  return roleNameToKey(role.roleName);
};

/** Chuyển mảng role backend sang RoleKey[] */
export const mapBackendRoles = (roles: BackendRole[]): RoleKey[] => {
  return roles.map(mapBackendRole).filter(Boolean) as RoleKey[];
};

/**
 * Lấy tên hiển thị của vai trò
 * @param roleKey mã vai trò (key)
 */
export const getRoleLabel = (roleKey?: RoleKey): string => {
  if (!roleKey) return "Không xác định";
  const role = ROLES[roleKey];
  return role ? role.roleName : "Không xác định";
};

/**
 * Lấy cấp bậc (level) của vai trò
 */
export const getRoleLevel = (roleKey?: RoleKey): number => {
  if (!roleKey) return 0;
  const role = ROLES[roleKey];
  return role ? role.level : 0;
};

/**
 * Kiểm tra xem role A có quyền lớn hơn hoặc bằng role B hay không
 */
export const hasHigherRole = (roleA: RoleKey, roleB: RoleKey): boolean => {
  return getRoleLevel(roleA) >= getRoleLevel(roleB);
};

/**
 * Kiểm tra xem người dùng có được phép truy cập route hoặc tính năng nào đó
 */
export const canAccess = (
  userRole: RoleKey,
  allowedRoles: RoleKey[]
): boolean => {
  return allowedRoles.includes(userRole);
};

/**
 * Trả về danh sách role có quyền thấp hơn role hiện tại
 */
export const getLowerRoles = (currentRole: RoleKey): RoleType[] => {
  const currentLevel = getRoleLevel(currentRole);
  return Object.values(ROLES).filter((r) => r.level < currentLevel);
};

/**
 * Trả về danh sách role có quyền cao hơn role hiện tại
 */
export const getHigherRoles = (currentRole: RoleKey): RoleType[] => {
  const currentLevel = getRoleLevel(currentRole);
  return Object.values(ROLES).filter((r) => r.level > currentLevel);
};
