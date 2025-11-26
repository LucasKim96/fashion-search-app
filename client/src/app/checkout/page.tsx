"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
	MapPin,
	Phone,
	User,
	FileText,
	ChevronLeft,
	Loader2,
	ShoppingBag,
} from "lucide-react";
import clsx from "clsx";

// Imports từ shared
import { useCart } from "@shared/features/cart/useCart.hook";
import { createOrderFromCartApi } from "@shared/features/order/order.api";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { formatCurrency } from "@shared/core/utils/formatCurrency";
import { buildImageUrl } from "@shared/core/utils/image.utils";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";
import { ImageWithFallback } from "@shared/core/components/ui/ImageWithFallback";

// --- Interface cho Form ---
interface CheckoutFormData {
	receiverName: string;
	phone: string;
	addressLine: string;
	note?: string;
}

export default function CheckoutPage() {
	const router = useRouter();
	const { cart, loading: cartLoading, fetchCart } = useCart(); // Lấy giỏ hàng
	const { showToast } = useNotification();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	// Hook Form
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CheckoutFormData>();

	// Redirect nếu giỏ hàng trống
	useEffect(() => {
		// Nếu đang loading, HOẶC đã đặt hàng thành công -> Không redirect
		if (cartLoading || isSuccess) return;

		if (!cart || cart.items.length === 0) {
			showToast("Giỏ hàng trống, vui lòng mua sắm thêm", "error"); // Đổi thành warning cho nhẹ nhàng
			router.push("/cart");
		}
	}, [cart, cartLoading, router, showToast, isSuccess]);

	const onSubmit = async (data: CheckoutFormData) => {
		if (!cart || cart.items.length === 0) return;

		setIsSubmitting(true);
		try {
			const res = await createOrderFromCartApi(data);

			if (res.success) {
				setIsSuccess(true); // 3. Set cờ thành công trước khi fetchCart

				showToast("Đặt hàng thành công! Cảm ơn bạn.", "success");

				// Refresh giỏ hàng (về 0) nhưng useEffect sẽ bị chặn bởi isSuccess
				await fetchCart();

				router.push("/user/orders");
			} else {
				showToast(res.message || "Đặt hàng thất bại", "error");
			}
		} catch (error: any) {
			showToast(error.message || "Lỗi kết nối", "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Tính toán phí ship (Hardcode hoặc logic tùy bạn)
	const shippingFee = 0;
	const finalTotal = (cart?.subtotal || 0) + shippingFee;

	if (cartLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-bg-alt">
				<Loader2 className="animate-spin text-primary" size={40} />
			</div>
		);
	}

	if (!cart || cart.items.length === 0) return null; // Đã handle redirect ở useEffect

	return (
		<div className="min-h-screen flex flex-col bg-bg-alt text-text">
			<ClientHeader />

			<main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Breadcrumb / Back button */}
				<button
					onClick={() => router.back()}
					className="flex items-center text-text-muted hover:text-primary transition-colors mb-6 font-medium">
					<ChevronLeft size={20} /> Quay lại giỏ hàng
				</button>

				<h1 className="text-3xl font-extrabold text-gray-900 mb-8 uppercase tracking-tight">
					Thanh toán
				</h1>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					{/* --- CỘT TRÁI: FORM THÔNG TIN (Chiếm 7 phần) --- */}
					<div className="lg:col-span-7 space-y-6">
						<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
							<h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
								<MapPin className="text-primary" />
								Thông tin giao hàng
							</h2>

							<form
								id="checkout-form"
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-5">
								{/* Họ tên */}
								<div className="relative">
									<label className="block text-sm font-semibold text-gray-700 mb-1">
										Tên người nhận <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<User size={18} className="text-gray-400" />
										</div>
										<input
											{...register("receiverName", {
												required: "Vui lòng nhập tên người nhận",
											})}
											placeholder="Ví dụ: Nguyễn Văn A"
											className={clsx(
												"w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20",
												errors.receiverName
													? "border-red-500 bg-red-50"
													: "border-gray-300 focus:border-primary"
											)}
										/>
									</div>
									{errors.receiverName && (
										<p className="text-red-500 text-xs mt-1">
											{errors.receiverName.message}
										</p>
									)}
								</div>

								{/* Số điện thoại */}
								<div className="relative">
									<label className="block text-sm font-semibold text-gray-700 mb-1">
										Số điện thoại <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<Phone size={18} className="text-gray-400" />
										</div>
										<input
											{...register("phone", {
												required: "Vui lòng nhập số điện thoại",
												pattern: {
													value: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
													message: "Số điện thoại không hợp lệ",
												},
											})}
											placeholder="Ví dụ: 0912345678"
											className={clsx(
												"w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20",
												errors.phone
													? "border-red-500 bg-red-50"
													: "border-gray-300 focus:border-primary"
											)}
										/>
									</div>
									{errors.phone && (
										<p className="text-red-500 text-xs mt-1">
											{errors.phone.message}
										</p>
									)}
								</div>

								{/* Địa chỉ */}
								<div className="relative">
									<label className="block text-sm font-semibold text-gray-700 mb-1">
										Địa chỉ nhận hàng <span className="text-red-500">*</span>
									</label>
									<div className="relative">
										<div className="absolute top-3.5 left-3 pointer-events-none">
											<MapPin size={18} className="text-gray-400" />
										</div>
										<textarea
											{...register("addressLine", {
												required: "Vui lòng nhập địa chỉ chi tiết",
											})}
											rows={3}
											placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
											className={clsx(
												"w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 resize-none",
												errors.addressLine
													? "border-red-500 bg-red-50"
													: "border-gray-300 focus:border-primary"
											)}
										/>
									</div>
									{errors.addressLine && (
										<p className="text-red-500 text-xs mt-1">
											{errors.addressLine.message}
										</p>
									)}
								</div>

								{/* Ghi chú */}
								<div className="relative">
									<label className="block text-sm font-semibold text-gray-700 mb-1">
										Ghi chú đơn hàng (Tùy chọn)
									</label>
									<div className="relative">
										<div className="absolute top-3.5 left-3 pointer-events-none">
											<FileText size={18} className="text-gray-400" />
										</div>
										<textarea
											{...register("note")}
											rows={2}
											placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi giao..."
											className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
										/>
									</div>
								</div>
							</form>
						</div>
					</div>

					{/* --- CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (Chiếm 5 phần) --- */}
					<div className="lg:col-span-5">
						<div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 sticky top-24">
							<h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
								<ShoppingBag className="text-primary" />
								Đơn hàng của bạn
							</h2>

							{/* Danh sách sản phẩm (Scrollable nếu dài) */}
							<div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
								{cart.items.map((item) => {
									// Logic lấy tên và ảnh tương tự CartPage
									// 1. Logic lấy ảnh: Thử tất cả các trường có thể có
									const displayImage =
										item.productVariant?.image || // Key chuẩn variant từ Backend
										item.productVariant?.imageUrl || // Key dự phòng variant
										item.product?.thumbnail || // Key thumbnail sản phẩm (nếu có)
										item.product?.images?.[0] || // Key mảng ảnh sản phẩm (Mongoose thường trả về cái này)
										"";

									// 2. Logic lấy tên: Ưu tiên pdName (tên chuẩn trong DB)
									const displayName =
										item.product?.pdName || item.product?.name || "Sản phẩm";
									return (
										<div
											key={item.productVariantId}
											className="flex gap-3 items-start">
											<div className="w-16 h-16 flex-shrink-0 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
												<ImageWithFallback
													src={displayImage}
													alt={displayName}
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="text-sm font-semibold text-gray-800 line-clamp-2">
													{displayName}
												</h4>

												{/* Logic hiển thị thuộc tính (Giữ nguyên vì đã ổn) */}
												<div className="text-xs text-gray-500 mt-1 line-clamp-1">
													{item.productVariant?.attributes
														?.map(
															(attr: any) =>
																`${attr.attributeLabel || attr.attribute}: ${
																	attr.valueLabel || attr.value
																}`
														)
														.join(" | ")}
												</div>

												<div className="flex justify-between items-center mt-1">
													<span className="text-xs text-gray-500">
														x{item.quantity}
													</span>
													<span className="text-sm font-medium text-primary-dark">
														{formatCurrency(item.price)}
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>

							{/* Tính tiền */}
							<div className="space-y-3 border-t border-gray-100 pt-4">
								<div className="flex justify-between text-sm text-gray-600">
									<span>Tạm tính</span>
									<span className="font-medium">
										{formatCurrency(cart.subtotal)}
									</span>
								</div>
								<div className="flex justify-between text-sm text-gray-600">
									<span>Phí vận chuyển</span>
									<span className="font-medium">
										{formatCurrency(shippingFee)}
									</span>
								</div>

								{/* Divider */}
								<div className="border-t border-dashed border-gray-200 my-2"></div>

								<div className="flex justify-between items-center">
									<span className="text-lg font-bold text-gray-800">
										Tổng cộng
									</span>
									<span className="text-2xl font-black text-secondary-dark">
										{formatCurrency(finalTotal)}
									</span>
								</div>
							</div>

							{/* Nút Đặt hàng */}
							<button
								form="checkout-form" // Link tới form bên trái
								type="submit"
								disabled={isSubmitting}
								className={clsx(
									"w-full mt-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2",
									isSubmitting
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-primary text-black hover:bg-primary-light hover:shadow-xl hover:-translate-y-1"
								)}>
								{isSubmitting ? (
									<>
										<Loader2 className="animate-spin" /> Đang xử lý...
									</>
								) : (
									"ĐẶT HÀNG NGAY"
								)}
							</button>

							<p className="text-xs text-center text-gray-400 mt-4">
								Bằng việc đặt hàng, bạn đồng ý với điều khoản dịch vụ của chúng
								tôi.
							</p>
						</div>
					</div>
				</div>
			</main>

			<ClientFooter />
		</div>
	);
}
