/**
 * Danh sách vai trò mặc định trong hệ thống bán hàng
 * level càng cao => quyền càng lớn
 */
export const ROLES = {
  CUSTOMER: { key: "CUSTOMER", roleName: "Khách hàng", level: 1 },
  SHOP_OWNER: { key: "SHOP_OWNER", roleName: "Chủ shop", level: 2 },
  ADMIN: { key: "ADMIN", roleName: "Quản trị viên", level: 3 },
  SUPER_ADMIN: { key: "SUPER_ADMIN", roleName: "Super Admin", level: 4 },
} as const;

/** Danh sách tất cả role dưới dạng mảng */
export const ROLE_LIST = Object.values(ROLES);

/** Kiểu dữ liệu cho RoleKey (ví dụ: "ADMIN", "CUSTOMER", ...) */
export type RoleKey = keyof typeof ROLES;

/** Kiểu dữ liệu cho 1 role */
export type RoleType = typeof ROLES[RoleKey];
