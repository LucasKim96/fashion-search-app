import { LayoutDashboard, Users, Store, Shirt } from "lucide-react";

export const adminMenuItems = [
  { label: "Tổng quan", icon: LayoutDashboard, path: "/admin/dashboard", color: "text-blue-500" },
  { label: "Người dùng", icon: Users, path: "/admin/accounts", color: "text-green-500" },
  { label: "Cửa hàng", icon: Store, path: "/admin/shops", color: "text-yellow-500" },
  { label: "Sản phẩm", icon: Shirt, path: "/admin/products", color: "text-red-500" },
];
