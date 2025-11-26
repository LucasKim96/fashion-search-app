"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ChevronLeft,
	MapPin,
	Phone,
	User,
	Package,
	Truck,
	CheckCircle,
	Clock,
	XCircle,
	AlertCircle,
	Loader2,
} from "lucide-react";
import clsx from "clsx";

// Import API & Types
import {
	getMyOrderDetailApi,
	cancelMyOrderApi,
	confirmReceivedApi,
} from "@shared/features/order/order.api";
import { Order } from "@shared/features/order/order.types";
import { formatCurrency, buildImageUrl, errorUtils } from "@shared/core/utils";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { ImageWithFallback } from "@shared/core/components/ui/ImageWithFallback";

// --- CẤU HÌNH STEPPER ---
const ORDER_STEPS = [
	{ status: "pending", label: "Đơn hàng đã đặt", icon: Clock },
	{ status: "packing", label: "Đang đóng gói", icon: Package },
	{ status: "shipping", label: "Đang vận chuyển", icon: Truck },
	{ status: "delivered", label: "Đã giao hàng", icon: CheckCircle },
	// { status: "completed", label: "Hoàn tất", icon: User },
];

const getStepStatus = (currentStatus: string) => {
	if (currentStatus === "cancelled") return -1;
	if (currentStatus === "delivered" || currentStatus === "completed") return 3;
	return ORDER_STEPS.findIndex((s) => s.status === currentStatus);
};

export default function BuyerOrderDetailPage() {
	const { orderId } = useParams() as { orderId: string }; // Lưu ý tên param phải khớp folder [orderId]
	const router = useRouter();
	const { showToast, showConfirm } = useNotification();

	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);

	// 1. Fetch Data
	const fetchOrder = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getMyOrderDetailApi(orderId);
			if (res.success && res.data) {
				setOrder(res.data);
			} else {
				showToast("Không tìm thấy đơn hàng", "error");
				router.push("/user/orders");
			}
		} catch (error) {
			showToast(errorUtils.parseApiError(error), "error");
		} finally {
			setLoading(false);
		}
	}, [orderId, router, showToast]);

	useEffect(() => {
		fetchOrder();
	}, [fetchOrder]);

	const handleCancelOrder = () => {
		// Gọi popup xác nhận
		showConfirm({
			message:
				"Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.",
			onConfirm: async () => {
				setActionLoading(true);
				try {
					const res = await cancelMyOrderApi(orderId);
					if (res.success) {
						showToast("Đã hủy đơn hàng thành công", "success");
						fetchOrder(); // Reload lại
					} else {
						showToast(res.message || "Hủy thất bại", "error");
					}
				} catch (error) {
					showToast(errorUtils.parseApiError(error), "error");
				} finally {
					setActionLoading(false);
				}
			},
		});
	};

	// 3. Hành động: Xác nhận đã nhận hàng (Sửa lại dùng showConfirm)
	const handleConfirmReceived = () => {
		showConfirm({
			message: "Bạn xác nhận đã nhận được hàng và hài lòng với sản phẩm?",
			onConfirm: async () => {
				setActionLoading(true);
				try {
					const res = await confirmReceivedApi(orderId);
					if (res.success) {
						showToast("Cảm ơn bạn đã mua hàng!", "success");
						fetchOrder();
					} else {
						showToast(res.message || "Có lỗi xảy ra", "error");
					}
				} catch (error) {
					showToast(errorUtils.parseApiError(error), "error");
				} finally {
					setActionLoading(false);
				}
			},
		});
	};

	if (loading)
		return (
			<div className="min-h-[60vh] flex items-center justify-center">
				<Loader2 className="animate-spin text-primary" size={40} />
			</div>
		);

	if (!order) return null;

	const currentStepIndex = getStepStatus(order.status);
	const isCancelled = order.status === "cancelled";

	return (
		<div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
			{/* HEADER & BACK */}
			<div className="flex items-center justify-between">
				<button
					onClick={() => router.back()}
					className="flex items-center text-gray-500 hover:text-primary transition-colors">
					<ChevronLeft size={20} /> Trở lại
				</button>
				<div className="text-sm text-gray-500">
					Mã đơn hàng:{" "}
					<span className="font-mono font-bold text-gray-800">
						#{order._id.slice(-6).toUpperCase()}
					</span>{" "}
					| <span className="uppercase">{order.status}</span>
				</div>
			</div>

			{/* 1. STEPPER TRẠNG THÁI */}
			<div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
				{isCancelled ? (
					<div className="flex flex-col items-center text-red-500 py-4">
						<XCircle size={48} className="mb-2" />
						<h3 className="text-xl font-bold">Đơn hàng đã bị hủy</h3>
						<p className="text-gray-500 text-sm mt-1">
							Vui lòng đặt lại đơn mới nếu bạn vẫn có nhu cầu.
						</p>
					</div>
				) : (
					<div className="relative flex justify-between items-center w-full">
						{/* Progress Line Background */}
						<div className="absolute top-5 left-0 w-full h-1 bg-gray-200 -z-10" />

						{/* Progress Line Active */}
						<div
							className="absolute top-5 left-0 h-1 bg-primary transition-all duration-500 -z-0"
							style={{
								width: `${
									(currentStepIndex / (ORDER_STEPS.length - 1)) * 100
								}%`,
							}}
						/>

						{/* Steps */}
						{ORDER_STEPS.map((step, index) => {
							const isActive = index <= currentStepIndex;
							const isCurrent = index === currentStepIndex;
							const StepIcon = step.icon;

							return (
								<div
									key={step.status}
									className="flex flex-col items-center gap-2 bg-white px-2">
									<div
										className={clsx(
											"w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
											isActive
												? "bg-primary border-primary text-white shadow-md scale-110"
												: "bg-white border-gray-300 text-gray-400"
										)}>
										<StepIcon size={18} />
									</div>
									<span
										className={clsx(
											"text-xs font-medium text-center max-w-[80px]",
											isCurrent ? "text-black font-bold" : "text-gray-500"
										)}>
										{step.label}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* 2. ĐỊA CHỈ NHẬN HÀNG */}
			<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
				<h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
					<MapPin size={20} className="text-primary" /> Địa chỉ nhận hàng
				</h3>
				<div className="space-y-1 text-gray-600">
					<p className="font-bold text-gray-900 text-base">
						{order.receiverName}
					</p>
					<p className="text-sm flex items-center gap-2">
						<Phone size={14} /> {order.phone}
					</p>
					<p className="text-sm text-gray-500">{order.addressLine}</p>
					{order.note && (
						<div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm italic border border-gray-100 flex gap-2">
							<AlertCircle
								size={16}
								className="text-gray-400 mt-0.5 flex-shrink-0"
							/>
							"{order.note}"
						</div>
					)}
				</div>
			</div>

			{/* 3. DANH SÁCH SẢN PHẨM (SHOP GROUP) */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
				{/* Shop Header */}
				<div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-primary">
							{order.shopId?.shopName?.[0] || "S"}
						</div>
						<span className="font-bold text-gray-800">
							{order.shopId?.shopName}
						</span>
					</div>
					<button
						onClick={() => router.push(`/shop/${order.shopId?._id}`)}
						className="text-xs text-primary hover:underline font-medium">
						Xem Shop
					</button>
				</div>

				{/* Order Items */}
				<div className="p-6 space-y-6">
					{order.orderItems.map((item, idx) => (
						<div key={idx} className="flex gap-4 items-start">
							{/* Ảnh Snapshot */}
							<div className="w-20 h-20 flex-shrink-0 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
								<ImageWithFallback
									src={item.imageAtOrder}
									alt={item.pdNameAtOrder}
									className="w-full h-full object-cover"
								/>
							</div>

							<div className="flex-1 min-w-0">
								<h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
									{item.pdNameAtOrder}
								</h4>
								<div className="flex flex-wrap gap-1 mb-2">
									{item.attributesAtOrder?.map((attr, i) => (
										<span
											key={i}
											className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
											{attr.valueName}
										</span>
									))}
								</div>
								<div className="flex justify-between items-end">
									<span className="text-sm text-gray-500">
										x{item.quantity}
									</span>
									<span className="text-sm font-bold text-gray-900">
										{formatCurrency(item.finalPriceAtOrder)}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Tổng tiền Footer */}
				<div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end items-center gap-4">
					<span className="text-gray-600 text-sm">Thành tiền:</span>
					<span className="text-xl font-black text-primary-dark">
						{formatCurrency(order.totalAmount)}
					</span>
				</div>
			</div>

			{/* 4. ACTION BUTTONS (Bottom Bar) */}
			<div className="flex justify-end gap-3 sticky bottom-0 bg-white/80 backdrop-blur-md p-4 border-t border-gray-200 -mx-4 md:mx-0 md:static md:bg-transparent md:border-0 md:p-0">
				{/* Nút Hủy: Chỉ hiện khi Pending */}
				{order.status === "pending" && (
					<button
						onClick={handleCancelOrder}
						disabled={actionLoading}
						className="px-6 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 disabled:opacity-50 transition-colors">
						{actionLoading ? "Đang xử lý..." : "Hủy Đơn Hàng"}
					</button>
				)}

				{/* Nút Đã nhận hàng: Chỉ hiện khi Delivered (đang giao xong) */}
				{(order.status === "delivered" || order.status === "shipping") && (
					<button
						onClick={handleConfirmReceived}
						disabled={actionLoading}
						className="px-6 py-2.5 rounded-xl bg-primary text-black font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50">
						{actionLoading ? "Đang xử lý..." : "Đã Nhận Được Hàng"}
					</button>
				)}

				{/* Nút Mua lại (Link về sản phẩm) */}
				{(order.status === "completed" || order.status === "cancelled") && (
					<button
						onClick={() =>
							router.push(`/products/${order.orderItems[0].productId}`)
						}
						className="px-6 py-2.5 rounded-xl bg-primary text-black font-bold shadow-sm hover:bg-primary-light transition-colors">
						Mua Lại
					</button>
				)}
			</div>
		</div>
	);
}
