"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMyOrders } from "@shared/features/order/useMyOrders.hook";
import { formatCurrency, buildImageUrl } from "@shared/core";
import { Package, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import clsx from "clsx";

// Mapping trạng thái sang tiếng Việt và màu sắc
const STATUS_MAP: Record<string, { label: string; color: string }> = {
	pending: { label: "Chờ xác nhận", color: "text-yellow-600 bg-yellow-50" },
	confirmed: { label: "Đã xác nhận", color: "text-blue-600 bg-blue-50" },
	packing: { label: "Đang đóng gói", color: "text-indigo-600 bg-indigo-50" },
	shipping: { label: "Đang giao hàng", color: "text-purple-600 bg-purple-50" },
	delivered: { label: "Đã giao hàng", color: "text-green-600 bg-green-50" },
	completed: { label: "Hoàn thành", color: "text-green-700 bg-green-100" },
	cancelled: { label: "Đã hủy", color: "text-red-600 bg-red-50" },
};

export default function OrdersPage() {
	const router = useRouter();
	const {
		orders,
		loading,
		statusFilter,
		handleStatusChange,
		pagination,
		handlePageChange,
	} = useMyOrders();

	// Danh sách tab filter
	const tabs = [
		{ key: "all", label: "Tất cả" },
		{ key: "pending", label: "Chờ xác nhận" },
		{ key: "shipping", label: "Đang giao" },
		{ key: "delivered", label: "Đã giao" }, // Hoặc completed tùy logic UI bạn muốn gộp
		{ key: "cancelled", label: "Đã hủy" },
	];

	if (loading && orders.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-[400px]">
				<Loader2 className="animate-spin text-primary" size={32} />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-6">
			<h1 className="text-2xl font-bold text-gray-800">Đơn hàng của bạn</h1>

			{/* --- Filter Tabs --- */}
			<div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => handleStatusChange(tab.key as any)}
						className={clsx(
							"px-4 py-2 rounded-full text-sm font-medium transition-all",
							statusFilter === tab.key
								? "bg-primary text-white shadow-md"
								: "bg-gray-100 text-gray-600 hover:bg-gray-200"
						)}>
						{tab.label}
					</button>
				))}
			</div>

			{/* --- Danh sách đơn hàng --- */}
			<div className="flex flex-col gap-4">
				{orders.length > 0 ? (
					orders.map((order) => {
						const firstItem = order.orderItems?.[0];
						const statusInfo = STATUS_MAP[order.status] || {
							label: order.status,
							color: "text-gray-600",
						};

						return (
							<div
								key={order._id}
								onClick={() => router.push(`/user/orders/${order._id}`)}
								className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row gap-5">
								{/* Hình ảnh sản phẩm đầu tiên */}
								<div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
									{firstItem?.imageAtOrder ? (
										<img
											src={buildImageUrl(firstItem.imageAtOrder)}
											alt={firstItem.pdNameAtOrder}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
										/>
									) : (
										<div className="flex items-center justify-center h-full text-gray-400">
											<Package size={24} />
										</div>
									)}
									{/* Badge số lượng nếu có nhiều hơn 1 sản phẩm */}
									{order.orderItems.length > 1 && (
										<span className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-tl-lg">
											+{order.orderItems.length - 1}
										</span>
									)}
								</div>

								{/* Thông tin chính */}
								<div className="flex-1 flex flex-col justify-between">
									<div>
										<div className="flex justify-between items-start mb-1">
											<h3 className="font-semibold text-gray-800 line-clamp-1 mr-2">
												{firstItem?.pdNameAtOrder || "Sản phẩm không xác định"}
											</h3>
											<span
												className={clsx(
													"px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap",
													statusInfo.color
												)}>
												{statusInfo.label}
											</span>
										</div>

										<p className="text-sm text-gray-500 mb-1">
											{order.shopId?.shopName || "Shop"} •{" "}
											{new Date(order.createdAt).toLocaleDateString("vi-VN")}
										</p>

										{/* Hiển thị thuộc tính (Size, Màu) nếu có */}
										{firstItem?.attributesAtOrder?.length > 0 && (
											<div className="flex gap-2 mt-1">
												{firstItem.attributesAtOrder.map((attr, idx) => (
													<span
														key={idx}
														className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded border border-gray-100">
														{attr.valueName}
													</span>
												))}
											</div>
										)}
									</div>

									<div className="flex justify-between items-end mt-3 sm:mt-0">
										<span className="text-sm text-gray-400">
											Mã đơn:{" "}
											<span className="font-mono text-gray-600">
												#{order._id.slice(-6).toUpperCase()}
											</span>
										</span>
										<div className="text-right">
											<p className="text-xs text-gray-500">Tổng tiền</p>
											<p className="text-lg font-bold text-primary">
												{formatCurrency(order.totalAmount)}
											</p>
										</div>
									</div>
								</div>
							</div>
						);
					})
				) : (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<Package className="text-gray-400" size={32} />
						</div>
						<p className="text-gray-500 font-medium">
							Chưa có đơn hàng nào ở trạng thái này
						</p>
					</div>
				)}
			</div>

			{/* --- Pagination --- */}
			{pagination.totalPages > 1 && (
				<div className="flex justify-center items-center gap-4 mt-6">
					<button
						onClick={() => handlePageChange(pagination.currentPage - 1)}
						disabled={pagination.currentPage === 1}
						className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
						<ChevronLeft size={20} />
					</button>
					<span className="text-sm font-medium text-gray-600">
						Trang {pagination.currentPage} / {pagination.totalPages}
					</span>
					<button
						onClick={() => handlePageChange(pagination.currentPage + 1)}
						disabled={pagination.currentPage === pagination.totalPages}
						className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
						<ChevronRight size={20} />
					</button>
				</div>
			)}
		</div>
	);
}
