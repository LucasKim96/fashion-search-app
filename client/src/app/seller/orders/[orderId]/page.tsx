"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	Package,
	Truck,
	CheckCircle,
	XCircle,
	Clock,
	User,
	Phone,
	MapPin,
	ChevronLeft,
	Loader2,
	AlertTriangle,
} from "lucide-react";
import clsx from "clsx";

// Import API
import {
	getShopOrderDetailApi,
	markPackingApi,
	markShippingApi,
	markDeliveredApi,
	cancelBySellerApi,
} from "@shared/features/order/order.api";
import { Order } from "@shared/features/order/order.types";
import { formatCurrency, errorUtils } from "@shared/core/utils";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { ImageWithFallback } from "@shared/core/components/ui/ImageWithFallback";
import PromptModal from "@/components/modals/PromptModal";

// --- CẤU HÌNH TRẠNG THÁI ---
const STATUS_CONFIG: Record<
	string,
	{ label: string; color: string; icon: any }
> = {
	pending: {
		label: "Chờ xác nhận",
		color: "text-yellow-700 bg-yellow-50 border-yellow-200",
		icon: Clock,
	},
	packing: {
		label: "Đang đóng gói",
		color: "text-indigo-700 bg-indigo-50 border-indigo-200",
		icon: Package,
	},
	shipping: {
		label: "Đang giao hàng",
		color: "text-purple-700 bg-purple-50 border-purple-200",
		icon: Truck,
	},
	delivered: {
		label: "Giao thành công",
		color: "text-green-700 bg-green-50 border-green-200",
		icon: CheckCircle,
	},
	completed: {
		label: "Hoàn thành",
		color: "text-teal-700 bg-teal-50 border-teal-200",
		icon: CheckCircle,
	},
	cancelled: {
		label: "Đã hủy",
		color: "text-red-700 bg-red-100 border-red-200",
		icon: XCircle,
	},
};

export default function SellerOrderDetailPage() {
	const { orderId } = useParams() as { orderId: string };
	const router = useRouter();
	const { showToast, showConfirm } = useNotification();

	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

	// 1. Tải dữ liệu đơn hàng
	const fetchOrder = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getShopOrderDetailApi(orderId);
			if (res.success && res.data) {
				setOrder(res.data);
			} else {
				showToast("Không tìm thấy đơn hàng", "error");
				router.push("/seller/orders");
			}
		} catch (error) {
			showToast(errorUtils.parseApiError(error), "error");
		} finally {
			setLoading(false);
		}
	}, [orderId, showToast, router]);

	useEffect(() => {
		fetchOrder();
	}, [fetchOrder]);

	const executeStatusUpdate = async (action: string, reason: string = "") => {
		setProcessing(true);
		try {
			let res;
			if (action === "pack") res = await markPackingApi(order!._id);
			if (action === "ship") res = await markShippingApi(order!._id);
			if (action === "deliver") res = await markDeliveredApi(order!._id);
			if (action === "cancel")
				res = await cancelBySellerApi(order!._id, reason);

			if (res && res.success) {
				showToast("Cập nhật trạng thái thành công", "success");
				fetchOrder();
				setIsCancelModalOpen(false); // Đóng modal nếu có
			} else {
				showToast(res?.message || "Có lỗi xảy ra", "error");
			}
		} catch (error) {
			showToast(errorUtils.parseApiError(error), "error");
		} finally {
			setProcessing(false);
		}
	};

	// 2. Xử lý chuyển trạng thái
	const handleStatusUpdate = (
		action: "pack" | "ship" | "deliver" | "cancel"
	) => {
		if (!order) return;

		// LOGIC HỦY: Mở Modal nhập lý do
		if (action === "cancel") {
			setIsCancelModalOpen(true);
			return;
		}

		// LOGIC KHÁC: Dùng showConfirm
		let message = "";
		let confirmText = "";
		let variant: "info" | "warning" | "danger" = "info";

		switch (action) {
			case "pack":
				message = "Xác nhận đã có hàng và bắt đầu đóng gói? (Sẽ trừ tồn kho)";
				confirmText = "Xác nhận đóng gói";
				break;
			case "ship":
				message = "Xác nhận đã giao hàng cho đơn vị vận chuyển?";
				confirmText = "Giao hàng";
				break;
			case "deliver":
				message = "Xác nhận khách đã nhận được hàng?";
				confirmText = "Hoàn tất";
				variant = "warning"; // Ví dụ đổi màu cảnh báo
				break;
		}

		showConfirm({
			message,
			// Bây giờ TS sẽ không báo lỗi nữa nếu bạn đã sửa bước 1
			confirmButtonText: confirmText,
			variant: variant,
			onConfirm: () => executeStatusUpdate(action),
		});
	};

	if (loading)
		return (
			<div className="flex justify-center p-20">
				<Loader2 className="animate-spin text-primary" size={40} />
			</div>
		);
	if (!order)
		return <div className="text-center p-10">Đơn hàng không tồn tại.</div>;

	const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG["pending"];
	const StatusIcon = statusConfig.icon;

	return (
		<div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
			{/* Header & Back */}
			<div className="flex items-center gap-4 mb-2">
				<button
					onClick={() => router.back()}
					className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
					<ChevronLeft size={24} />
				</button>
				<h1 className="text-2xl font-bold text-gray-800">
					Chi tiết đơn hàng #{order._id.slice(-6).toUpperCase()}
				</h1>
			</div>

			{/* 1. STATUS BAR & ACTIONS */}
			<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
				<div className="flex items-center gap-4">
					<div
						className={clsx(
							"p-4 rounded-full border",
							statusConfig.color.replace("text-", "bg-").split(" ")[1], // Lấy bg class
							statusConfig.color.split(" ")[2] // Lấy border class
						)}>
						<StatusIcon
							size={32}
							className={statusConfig.color.split(" ")[0]}
						/>
					</div>
					<div>
						<p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
							Trạng thái hiện tại
						</p>
						<p
							className={clsx(
								"font-bold text-xl",
								statusConfig.color.split(" ")[0]
							)}>
							{statusConfig.label}
						</p>
					</div>
				</div>

				{/* ACTION BUTTONS: Hiển thị dựa trên trạng thái hiện tại */}
				<div className="flex flex-wrap gap-3 w-full md:w-auto">
					{order.status === "pending" && (
						<>
							<button
								onClick={() => handleStatusUpdate("cancel")}
								disabled={processing}
								className="px-5 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-bold disabled:opacity-50 transition-colors flex-1 md:flex-none justify-center flex">
								Hủy đơn
							</button>
							<button
								onClick={() => handleStatusUpdate("pack")}
								disabled={processing}
								className="px-6 py-2.5 bg-primary text-black border border-primary font-bold rounded-xl hover:bg-primary-light shadow-md disabled:opacity-50 flex items-center gap-2 transition-all flex-1 md:flex-none justify-center">
								{processing && <Loader2 className="animate-spin" size={18} />}
								Xác nhận đóng gói
							</button>
						</>
					)}

					{order.status === "packing" && (
						<button
							onClick={() => handleStatusUpdate("ship")}
							disabled={processing}
							className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md disabled:opacity-50 flex items-center gap-2 w-full md:w-auto justify-center">
							{processing && <Loader2 className="animate-spin" size={18} />}
							Giao cho vận chuyển
						</button>
					)}

					{order.status === "shipping" && (
						<button
							onClick={() => handleStatusUpdate("deliver")}
							disabled={processing}
							className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md disabled:opacity-50 flex items-center gap-2 w-full md:w-auto justify-center">
							{processing && <Loader2 className="animate-spin" size={18} />}
							Xác nhận đã giao
						</button>
					)}

					{/* Đơn đã hoàn tất hoặc hủy sẽ không có nút thao tác */}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 2. THÔNG TIN KHÁCH HÀNG (Cột trái) */}
				<div className="lg:col-span-1 space-y-6">
					<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
						<h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2 text-lg">
							<User size={20} className="text-gray-500" /> Thông tin khách hàng
						</h3>
						<div className="space-y-4 text-sm text-gray-600">
							<div className="pb-3 border-b border-gray-100">
								<p className="text-xs text-gray-400 uppercase font-semibold mb-1">
									Người nhận
								</p>
								<p className="font-bold text-gray-900 text-base">
									{order.receiverName}
								</p>
							</div>
							<div className="pb-3 border-b border-gray-100">
								<p className="text-xs text-gray-400 uppercase font-semibold mb-1">
									Số điện thoại
								</p>
								<p className="font-medium text-gray-900 flex items-center gap-2">
									<Phone size={16} className="text-gray-400" /> {order.phone}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 uppercase font-semibold mb-1">
									Địa chỉ giao hàng
								</p>
								<p className="font-medium text-gray-900 flex items-start gap-2 mt-1 leading-relaxed">
									<MapPin
										size={16}
										className="mt-0.5 flex-shrink-0 text-gray-400"
									/>
									{order.addressLine}
								</p>
							</div>
							{order.note && (
								<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl mt-2">
									<p className="text-xs text-yellow-700 font-bold flex items-center gap-1 mb-1">
										<AlertTriangle size={14} /> Ghi chú từ khách:
									</p>
									<p className="text-gray-800 italic">{order.note}</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* 3. DANH SÁCH SẢN PHẨM (Cột phải - Rộng hơn) */}
				<div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
					<h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2 text-lg">
						<Package size={20} className="text-gray-500" /> Sản phẩm (
						{order.orderItems.length})
					</h3>

					<div className="divide-y divide-gray-100">
						{order.orderItems.map((item, i) => (
							<div key={i} className="py-4 flex gap-4 items-start">
								{/* SỬ DỤNG ImageWithFallback */}
								<div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
									<ImageWithFallback
										src={item.imageAtOrder}
										alt={item.pdNameAtOrder}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="flex-1">
									<p className="font-bold text-gray-800 line-clamp-2 text-base mb-1">
										{item.pdNameAtOrder}
									</p>
									{/* Hiển thị thuộc tính snapshot */}
									{item.attributesAtOrder &&
										item.attributesAtOrder.length > 0 && (
											<div className="flex flex-wrap gap-2 mt-1">
												{item.attributesAtOrder.map((attr, idx) => (
													<span
														key={idx}
														className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-600 font-medium">
														{attr.attributeName}: {attr.valueName}
													</span>
												))}
											</div>
										)}
								</div>
								<div className="text-right">
									<p className="text-sm text-gray-500 mb-1">x{item.quantity}</p>
									<p className="font-bold text-gray-900 text-base">
										{formatCurrency(item.finalPriceAtOrder * item.quantity)}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Footer Tổng tiền */}
					<div className="border-t border-gray-200 mt-6 pt-4 space-y-3">
						<div className="flex justify-between text-sm text-gray-500">
							<span>Tạm tính</span>
							<span>{formatCurrency(order.totalAmount)}</span>
						</div>
						{/* Có thể thêm phí ship ở đây nếu backend trả về */}
						<div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
							<span className="font-bold text-gray-800 text-lg">
								Tổng thanh toán
							</span>
							<span className="font-black text-2xl text-primary-dark">
								{formatCurrency(order.totalAmount)}
							</span>
						</div>
					</div>
				</div>
			</div>
			{/* Thêm Modal Hủy vào cuối */}
			<PromptModal
				isOpen={isCancelModalOpen}
				onClose={() => setIsCancelModalOpen(false)}
				title="Hủy Đơn Hàng"
				description="Vui lòng nhập lý do hủy đơn hàng này. Hành động này không thể hoàn tác."
				placeholder="Ví dụ: Hết hàng, Khách yêu cầu hủy..."
				confirmText="Xác nhận Hủy"
				variant="danger"
				loading={processing}
				onConfirm={(reason) => executeStatusUpdate("cancel", reason)}
			/>
		</div>
	);
}
