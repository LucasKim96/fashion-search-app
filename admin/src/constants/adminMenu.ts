// admin/src/constants/adminMenu.ts
import { LayoutDashboard, Users, Store, Shirt } from "lucide-react";

export const adminMenuItems = [
  { label: "Tổng quan", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Người dùng", icon: Users, path: "/admin/users" },
  { label: "Cửa hàng", icon: Store, path: "/admin/shops" },
  { label: "Sản phẩm", icon: Shirt, path: "/admin/products" },
];
