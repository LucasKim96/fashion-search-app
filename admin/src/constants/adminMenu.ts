import { AttributeWithValues } from './../../../shared/features/attribute/attribute.types';
import { LayoutDashboard, Users, Store, Shirt } from "lucide-react";

export const adminMenuItems = [
  { label: "Tổng quan", icon: LayoutDashboard, path: "/admin/dashboard", color: "text-blue-500" },
  { label: "Người dùng", icon: Users, path: "/admin/accounts", color: "text-green-500" },
  { label: "Thuộc tính", icon: Store, path: "/admin/attributes", color: "text-yellow-500" },
  { label: "test value", icon: Shirt, path: "/admin/test-values", color: "text-red-500" },
];
