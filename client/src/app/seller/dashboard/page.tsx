"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, Package, ShoppingBag, Users, Loader2 } from "lucide-react";
import { getShopDashboardStatsApi } from "@shared/features/shop/shop.api";
import { formatCurrency } from "@shared/core/utils"; // Hàm format tiền tệ của bạn
import { DashboardStats } from "@shared/features/shop/shop.types"; // Nhớ export interface ở bước trên

export default function SellerDashboardPage() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const res = await getShopDashboardStatsApi();
				if (res.success && res.data) {
					setStats(res.data);
				}
			} catch (error) {
				console.error("Failed to fetch dashboard stats", error);
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="animate-spin text-primary" size={40} />
			</div>
		);
	}

	// Dữ liệu mặc định nếu lỗi hoặc chưa có
	const data = stats || {
		totalRevenue: 0,
		totalOrders: 0,
		totalProducts: 0,
		totalCustomers: 0,
	};

	const statCards = [
		{
			icon: BarChart3,
			label: "Tổng doanh thu",
			value: formatCurrency(data.totalRevenue),
			bg: "bg-blue-50",
			color: "text-blue-600",
		},
		{
			icon: Package,
			label: "Đơn hàng",
			value: data.totalOrders.toString(),
			bg: "bg-yellow-50",
			color: "text-yellow-600",
		},
		{
			icon: ShoppingBag,
			label: "Sản phẩm",
			value: data.totalProducts.toString(),
			bg: "bg-purple-50",
			color: "text-purple-600",
		},
		{
			icon: Users,
			label: "Khách hàng",
			value: data.totalCustomers.toString(),
			bg: "bg-green-50",
			color: "text-green-600",
		},
	];

	return (
		<div className="flex flex-col gap-6 p-4 md:p-0">
			<h1 className="text-2xl font-bold text-gray-800">Bảng điều khiển</h1>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{statCards.map(({ icon: Icon, label, value, bg, color }) => (
					<div
						key={label}
						className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-start gap-3 hover:shadow-md transition-all">
						<div className={`p-3 rounded-xl ${bg}`}>
							<Icon size={24} className={color} />
						</div>
						<div>
							<p className="text-sm text-gray-500 font-medium">{label}</p>
							<p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
						</div>
					</div>
				))}
			</div>

			<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4 h-80 flex flex-col items-center justify-center text-gray-400">
				<BarChart3 size={48} className="mb-2 opacity-20" />
				<p>Biểu đồ doanh thu (Tính năng đang phát triển)</p>
			</div>
		</div>
	);
}
