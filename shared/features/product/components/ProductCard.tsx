"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff, Trash2, Edit } from "lucide-react";
import { Product } from "../product.types"; // Import type Product của bạn
import { useProduct } from "../index"; // Import hook
import {
	SidebarTooltip,
	buildImageUrl,
	formatCurrency,
	useNotification,
} from "@shared/core"; // Import Tooltip (Giả sử bạn có component này)

interface ProductCardProps {
	product: Product;
	mode?: "client" | "shop" | "admin"; // 3 chế độ hiển thị
	width?: string; // Option width (VD: "w-[200px]", "w-full")
	showStatusBadge?: boolean; // Option hiển thị badge trạng thái trên ảnh
	showActions?: boolean; // Option hiển thị nút ẩn/xóa (cho admin/shop)
	onProductChange?: () => void; // Callback khi có thay đổi để cha reload
	onClick?: () => void; // Sự kiện khi click vào card (để xem chi tiết chẳng hạn)
}

export const ProductCard: React.FC<ProductCardProps> = ({
	product,
	mode = "client",
	width = "w-full",
	showStatusBadge = true,
	showActions = true,
	onProductChange,
	onClick,
}) => {
	// --- Hooks ---
	const {
		toggleProductActive,
		deleteProductAdmin, // Admin Actions
		toggleShopProduct,
		deleteShopProduct, // Shop Actions
	} = useProduct();

	const [isLoading, setIsLoading] = useState(false);
	const { showConfirm } = useNotification();
	// --- Handlers ---
	// Xử lý ẩn/hiện sản phẩm
	const handleToggleActive = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isLoading) return;

		const actionText = product.isActive ? "ẩn" : "hiện";

		// Dùng showConfirm thay vì gọi trực tiếp
		showConfirm({
			message: `Bạn có chắc chắn muốn ${actionText} sản phẩm "${product.pdName}" không?`,
			onConfirm: async () => {
				setIsLoading(true);
				try {
					let res;
					if (mode === "admin") {
						res = await toggleProductActive(product._id);
					} else if (mode === "shop") {
						res = await toggleShopProduct(product._id);
					}

					if (res?.success) {
						onProductChange?.();
					}
				} finally {
					setIsLoading(false);
				}
			},
		});
	};

	// Xử lý xóa sản phẩm
	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isLoading) return;

		showConfirm({
			message:
				"Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.",
			onConfirm: async () => {
				setIsLoading(true);
				try {
					let res;
					if (mode === "admin") {
						res = await deleteProductAdmin(product._id);
					} else if (mode === "shop") {
						res = await deleteShopProduct(product._id);
					}

					if (res?.success) {
						onProductChange?.();
					}
				} finally {
					setIsLoading(false);
				}
			},
		});
	};

	// Lấy ảnh hiển thị (Ảnh đầu tiên hoặc placeholder)
	const imageUrl =
		product.images && product.images.length > 0
			? buildImageUrl(product.images[0])
			: "/images/placeholder-product.png"; // Đường dẫn placeholder mặc định

	// Xác định trạng thái hiển thị badge
	// Client thường không hiện badge "Đang ẩn" vì Client chỉ thấy active.
	// Nhưng nếu logic Client cho phép thấy inactive thì vẫn hiện.
	const shouldShowBadge = showStatusBadge && !product.isActive;

	return (
		<div
			className={clsx(
				"relative bg-white rounded-xl border border-gray-200 transition-all duration-300",
				"shadow-md hover:shadow-xl hover:-translate-y-1 cursor-pointer ",
				"group flex flex-col p-2",
				width,
				!product.isActive &&
					mode !== "client" &&
					"opacity-90 bg-gray-50 border-dashed border-gray-300",
				isLoading && "pointer-events-none opacity-50"
			)}
			onClick={onClick}>
			{/* 1. Phần Ảnh (Image Container) */}
			<div className="relative aspect-square w-full bg-gray-100 overflow-hidden rounded-lg">
				<img
					src={imageUrl}
					alt={product.pdName}
					className={clsx(
						"w-full h-full object-cover",
						// --- HIỆU ỨNG SCALE ---
						"transition-transform duration-500 ease-in-out", // Chuyển động mượt trong 0.5s
						"group-hover:scale-110" // Zoom nhẹ lên 110% khi hover vào Card
					)}
					loading="lazy"
				/>
				{/* --- HIỆU ỨNG LỚP PHỦ (OVERLAY) --- */}
				{/* Lớp này tạo màu tối nhẹ phủ lên ảnh giúp tạo chiều sâu sang trọng */}
				<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
				{/* Badge trạng thái */}
				{shouldShowBadge && (
					<span className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider rounded backdrop-blur-sm">
						Đang ẩn
					</span>
				)}
			</div>

			{/* 2. Phần Thông tin (Info Container) */}
			<div className="pt-3 px-1 pb-1 flex flex-col flex-1 gap-0">
				{/* Tên sản phẩm */}
				<h3
					className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug mb-3"
					title={product.pdName}>
					{product.pdName}
				</h3>

				{/* Giá tiền */}
				<p className="text-red-600 font-bold text-base mt-auto">
					{formatCurrency(product.basePrice)}
				</p>

				{/* 3. Phần Actions */}
				{mode !== "client" && showActions && (
					<div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
						{/* CỘT 1: Nút Toggle HOẶC Khoảng trống (Spacer) */}
						{mode !== "admin" ? (
							<div className="relative flex-1">
								<button
									onClick={handleToggleActive}
									className={clsx(
										"flex w-full justify-center items-center p-1.5 rounded-full shadow-sm transition-all duration-200 active:scale-95 peer",
										product.isActive
											? "bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-700 hover:to-gray-800"
											: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-700 hover:to-indigo-800"
									)}>
									{product.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
								</button>
								<SidebarTooltip
									position="top"
									label={product.isActive ? "Ẩn sản phẩm" : "Hiện sản phẩm"}
								/>
							</div>
						) : (
							// --- QUAN TRỌNG: Spacer cho Admin ---
							// Nếu là admin, render div rỗng để chiếm chỗ cột 1, đẩy nút xóa sang cột 2
							<div className="flex-1" />
						)}

						{/* CỘT 2: Nút Xóa (Luôn hiển thị) */}
						<div className="relative flex-1">
							<button
								onClick={handleDelete}
								className="flex w-full justify-center items-center p-1.5 rounded-full shadow-sm transition-all duration-200 active:scale-95 peer
                        bg-gradient-to-r from-red-600 to-red-600 text-white hover:from-red-700 hover:to-red-700 ">
								<Trash2 size={16} />
							</button>
							<SidebarTooltip position="top" label="Xóa sản phẩm" />
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
