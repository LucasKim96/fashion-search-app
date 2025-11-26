"use client";

import React, { useEffect, useState } from "react";
import {
	BarChart3,
	Package,
	ShoppingBag,
	Users,
	Loader2,
	TrendingUp,
} from "lucide-react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	AreaChart,
	Area,
} from "recharts";

import { getShopDashboardStatsApi } from "@shared/features/shop/shop.api";
import { formatCurrency } from "@shared/core/utils";
import { DashboardStats } from "@shared/features/shop/shop.types";

// --- DỮ LIỆU GIẢ LẬP CHO BIỂU ĐỒ (Placeholder) ---
// Sau này thay bằng data từ API
const MOCK_REVENUE_DATA = [
	{ month: "Th1", revenue: 3200000 },
	{ month: "Th2", revenue: 4200000 },
	{ month: "Th3", revenue: 6800000 },
	{ month: "Th4", revenue: 5200000 },
	{ month: "Th5", revenue: 8000000 },
	{ month: "Th6", revenue: 9400000 },
	{ month: "Th7", revenue: 11200000 },
];

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
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="animate-spin text-primary" size={40} />
			</div>
		);
	}

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
		<div className="flex flex-col gap-8 p-4 md:p-0 pb-20">
			{/* HEADER */}
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-gray-800">Bảng điều khiển</h1>
				<div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
					Cập nhật: {new Date().toLocaleDateString("vi-VN")}
				</div>
			</div>

			{/* STATS CARDS */}
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

			{/* CHARTS SECTION */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* BIỂU ĐỒ DOANH THU (Chiếm 2/3) */}
				<div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
								<TrendingUp size={20} className="text-primary" />
								Biểu đồ doanh thu
							</h2>
							<p className="text-sm text-gray-500">
								Thống kê doanh thu 6 tháng gần nhất
							</p>
						</div>
						{/* <select className="text-sm border rounded-md px-2 py-1 outline-none">
                            <option>6 tháng qua</option>
                            <option>Năm nay</option>
                        </select> */}
					</div>

					<div className="w-full h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={MOCK_REVENUE_DATA}>
								<defs>
									<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#EAB308" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#eee"
								/>
								<XAxis
									dataKey="month"
									axisLine={false}
									tickLine={false}
									tick={{ fill: "#6B7280", fontSize: 12 }}
									dy={10}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fill: "#6B7280", fontSize: 12 }}
									tickFormatter={(v) => `${v / 1000000}M`}
								/>
								<Tooltip
									formatter={(value: number) => [
										`${value.toLocaleString()}₫`,
										"Doanh thu",
									]}
									contentStyle={{
										borderRadius: "8px",
										border: "none",
										boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
									}}
								/>
								<Area
									type="monotone"
									dataKey="revenue"
									stroke="#EAB308" // Màu Primary (Vàng)
									strokeWidth={3}
									fillOpacity={1}
									fill="url(#colorRevenue)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* TOP PRODUCTS (Chiếm 1/3 - Placeholder) */}
				<div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
					<h2 className="text-lg font-bold text-gray-800 mb-4">Top sản phẩm</h2>
					<div className="flex-1 flex flex-col justify-center items-center text-gray-400 text-center">
						<Package size={48} className="mb-2 opacity-20" />
						<p className="text-sm">Dữ liệu đang được cập nhật...</p>
					</div>
				</div>
			</div>
		</div>
	);
}
