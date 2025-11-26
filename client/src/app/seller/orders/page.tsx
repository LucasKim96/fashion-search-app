"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useShopOrders } from "@shared/features/order/useShopOrders.hook"; // Import hook mới
import { formatCurrency } from "@shared/core/utils";
import {
	Loader2,
	Package,
	ChevronLeft,
	ChevronRight,
	User,
	Clock,
	CheckCircle,
	Truck,
	Archive,
} from "lucide-react";
import clsx from "clsx";

// Cấu hình hiển thị trạng thái
const STATUS_CONFIG: Record<
	string,
	{ label: string; color: string; icon: any }
> = {
	pending: {
		label: "Chờ xác nhận",
		color: "text-yellow-700 bg-yellow-100 border-yellow-200",
		icon: Clock,
	},
	packing: {
		label: "Đang đóng gói",
		color: "text-indigo-700 bg-indigo-100 border-indigo-200",
		icon: Package,
	},
	shipping: {
		label: "Đang giao",
		color: "text-purple-700 bg-purple-100 border-purple-200",
		icon: Truck,
	},
	delivered: {
		label: "Đã giao",
		color: "text-green-700 bg-green-100 border-green-200",
		icon: CheckCircle,
	},
	completed: {
		label: "Hoàn tất",
		color: "text-teal-700 bg-teal-100 border-teal-200",
		icon: CheckCircle,
	},
	cancelled: {
		label: "Đã hủy",
		color: "text-red-700 bg-red-100 border-red-200",
		icon: Archive,
	},
	confirmed: {
		label: "Đã xác nhận",
		color: "text-blue-700 bg-blue-100 border-blue-200",
		icon: CheckCircle,
	},
};

export default function SellerOrdersPage() {
	const router = useRouter();
	const {
		orders,
		loading,
		statusFilter,
		handleStatusChange,
		pagination,
		handlePageChange,
	} = useShopOrders();

	// Danh sách Tabs lọc
	const tabs = [
		{ key: "all", label: "Tất cả" },
		{ key: "pending", label: "Chờ xác nhận" },
		{ key: "packing", label: "Chờ lấy hàng" },
		{ key: "shipping", label: "Đang giao" },
		{ key: "completed", label: "Hoàn thành" },
		{ key: "cancelled", label: "Đã hủy" },
	];

	return (
		<div className="flex flex-col gap-6 p-4 md:p-0">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
			</div>

			{/* --- FILTER TABS --- */}
			<div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => handleStatusChange(tab.key as any)}
						className={clsx(
							"px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2",
							statusFilter === tab.key
								? "border-primary text-primary bg-primary/5"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
						)}>
						{tab.label}
					</button>
				))}
			</div>

			{/* --- DANH SÁCH ĐƠN HÀNG --- */}
			{loading ? (
				<div className="flex justify-center items-center h-64">
					<Loader2 className="animate-spin text-primary" size={40} />
				</div>
			) : orders.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
					<Package size={48} className="mb-2 opacity-50" />
					<p>Không có đơn hàng nào.</p>
				</div>
			) : (
				<div className="flex flex-col gap-4">
					{orders.map((order) => {
						const statusInfo =
							STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
						const StatusIcon = statusInfo.icon;

						// Lấy sản phẩm đầu tiên để hiển thị tóm tắt
						const firstItem = order.orderItems?.[0];
						const itemCount = order.orderItems?.length || 0;

						return (
							<div
								key={order._id}
								onClick={() => router.push(`/seller/orders/${order._id}`)}
								className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center">
								{/* ICON TRẠNG THÁI */}
								<div
									className={clsx(
										"p-3 rounded-full flex-shrink-0",
										statusInfo.color.split(" ")[1]
									)}>
									<StatusIcon
										size={24}
										className={statusInfo.color.split(" ")[0]}
									/>
								</div>

								<div className="flex-1 w-full">
									<div className="flex justify-between items-start mb-2">
										<p className="font-bold text-gray-800 text-lg">
											#{order._id.slice(-6).toUpperCase()}
										</p>
										<span
											className={clsx(
												"px-3 py-1 rounded-full text-xs font-bold border",
												statusInfo.color
											)}>
											{statusInfo.label}
										</span>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4 text-sm text-gray-600">
										<div className="flex items-center gap-2">
											<User size={16} />
											<span className="font-medium">{order.receiverName}</span>
										</div>
										<div className="flex items-center gap-2">
											<Clock size={16} />
											<span>
												{new Date(order.createdAt).toLocaleString("vi-VN")}
											</span>
										</div>
										<div className="col-span-1 md:col-span-2 mt-1 text-gray-500 truncate">
											{firstItem ? (
												<span>
													{firstItem.pdNameAtOrder}
													{itemCount > 1 && (
														<span className="font-bold text-primary">
															{" "}
															(+{itemCount - 1} sản phẩm khác)
														</span>
													)}
												</span>
											) : (
												"Chi tiết đơn hàng..."
											)}
										</div>
									</div>
								</div>

								<div className="text-right w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0 flex flex-row md:flex-col justify-between items-center md:items-end">
									<p className="text-xs text-gray-500">Tổng thanh toán</p>
									<p className="text-xl font-bold text-primary-dark">
										{formatCurrency(order.totalAmount)}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* --- PAGINATION --- */}
			{pagination.totalPages > 1 && (
				<div className="flex justify-center items-center gap-4 mt-4">
					<button
						onClick={() => handlePageChange(pagination.currentPage - 1)}
						disabled={pagination.currentPage === 1}
						className="p-2 rounded-full bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
						<ChevronLeft size={20} />
					</button>
					<span className="text-sm font-medium text-gray-600">
						Trang {pagination.currentPage} / {pagination.totalPages}
					</span>
					<button
						onClick={() => handlePageChange(pagination.currentPage + 1)}
						disabled={pagination.currentPage === pagination.totalPages}
						className="p-2 rounded-full bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
						<ChevronRight size={20} />
					</button>
				</div>
			)}
		</div>
	);
}
