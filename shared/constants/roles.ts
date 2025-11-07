export const ROLES = {
  ADMIN: "admin",
  SHOP: "shop",
  USER: "user",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
