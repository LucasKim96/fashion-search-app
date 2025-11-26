import { LayoutDashboard, Users, Store, Shirt } from "lucide-react";

export const shopMenuItems = [
	{
		label: "Tổng quan",
		icon: LayoutDashboard,
		path: "/seller/dashboard",
		color: "text-blue-500",
	},
	{
		label: "Phân tích",
		icon: Shirt,
		path: "/seller/analytics",
		color: "text-red-500",
	},
	{
		label: "Sản phẩm",
		icon: Users,
		path: "/seller/products",
		color: "text-green-500",
	},
	{
		label: "Thuộc tính",
		icon: Store,
		path: "/seller/attributes",
		color: "text-yellow-500",
	},
	{
		label: "Đơn hàng",
		icon: Store,
		path: "/seller/orders",
		color: "text-purple-500",
	},
];
