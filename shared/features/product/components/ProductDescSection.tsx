"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Store, FileText, AlignLeft, ExternalLink } from "lucide-react";
import { buildImageUrl } from "@shared/core/utils/image.utils";
import clsx from "clsx";

interface ShopInfo {
	_id: string;
	shopName: string;
	logoUrl?: string;
	isOnline?: boolean; // Thêm trường này
	lastActiveText?: string; // Thêm trường này
}

interface ProductDescSectionProps {
	currentMode: "view" | "create" | "edit";
	isShop?: boolean;
	shopInfo?: ShopInfo | null;
}

export const ProductDescSection: React.FC<ProductDescSectionProps> = ({
	shopInfo,
	isShop = false,
	currentMode,
}) => {
	const {
		register,
		formState: { errors },
		watch,
	} = useFormContext();
	const [imageError, setImageError] = useState(false);
	// Lấy giá trị mô tả hiện tại từ form để hiển thị ở chế độ View
	const descriptionValue = watch("description");
	return (
		<div className="space-y-8">
			{/* 1. THÔNG TIN SHOP (HEADER CARD) */}
			{/* Chỉ hiện nếu KHÔNG phải shop (khách xem) */}
			{!isShop && shopInfo && (
				<div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
					{/* Decoration Background */}
					<div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50 transition-transform group-hover:scale-110" />

					<div className="relative flex items-center gap-5 p-5 border-l-4 border-blue-500">
						{/* Avatar */}
						<div className="relative">
							<div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md flex items-center justify-center bg-gray-50">
								{shopInfo.logoUrl && !imageError ? (
									<img
										src={buildImageUrl(shopInfo.logoUrl)}
										alt="Shop Logo"
										className="w-full h-full object-cover"
										onError={() => setImageError(true)}
									/>
								) : (
									<Store className="text-blue-400" size={28} />
								)}
							</div>

							{/* --- LOGIC TRẠNG THÁI (DOT) --- */}
							<div
								className={clsx(
									"absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full",
									shopInfo.isOnline ? "bg-green-500" : "bg-gray-400" // Xanh nếu online, Xám nếu offline
								)}
								title={shopInfo.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
							/>
						</div>

						<div className="flex-1 min-w-0">
							<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
								Nhà cung cấp
							</span>
							<h4 className="font-extrabold text-gray-800 text-xl truncate leading-tight">
								{shopInfo.shopName || "Cửa hàng"}
							</h4>

							{/* --- LOGIC HIỂN THỊ TRẠNG THÁI TEXT --- */}
							<div className="mt-1 flex items-center gap-1.5">
								{shopInfo.isOnline ? (
									// Trường hợp Online
									<>
										<span className="relative flex h-2 w-2">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
											<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
										</span>
										<p className="text-xs font-bold text-green-600">
											Đang hoạt động
										</p>
									</>
								) : (
									// Trường hợp Offline
									<>
										<span className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
										<p className="text-xs text-gray-500 font-medium">
											{shopInfo.lastActiveText || "Ngoại tuyến"}
										</p>
									</>
								)}
							</div>
						</div>

						<button className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-600 hover:text-white transition-all duration-300">
							Xem Shop
							<ExternalLink
								size={16}
								className="group-hover/btn:translate-x-0.5 transition-transform"
							/>
						</button>
					</div>
				</div>
			)}

			{/* 2. MÔ TẢ SẢN PHẨM */}
			<div className="flex flex-col gap-2">
				{/* --- VIEW MODE --- */}
				{currentMode === "view" ? (
					<div className="group relative">
						<div className="pl-3 border-l-4 border-gray-300 transition-all hover:border-gray-400">
							<div className="flex items-center gap-2 mb-3">
								<FileText size={18} className="text-gray-400" />
								<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
									Chi tiết sản phẩm
								</span>
							</div>

							<div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed whitespace-pre-line min-h-[120px] relative overflow-hidden">
								{/* Watermark Icon */}
								<AlignLeft
									className="absolute top-4 right-4 text-gray-200/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
									size={80}
								/>

								{descriptionValue ? (
									<div className="relative z-10 prose prose-sm max-w-none text-base">
										{descriptionValue}
									</div>
								) : (
									<span className="text-gray-400 italic flex items-center gap-2">
										Chưa có mô tả cho sản phẩm này.
									</span>
								)}
							</div>
						</div>
					</div>
				) : (
					// --- EDIT / CREATE MODE ---
					<div className="relative group/input">
						<label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
							Mô tả chi tiết
						</label>

						<div className="relative transition-all duration-300 focus-within:-translate-y-1 focus-within:shadow-lg rounded-xl bg-white">
							{/* Icon nằm ở góc trên trái */}
							<div className="absolute top-4 left-4 pointer-events-none">
								<AlignLeft
									className={clsx(
										"transition-colors duration-300",
										errors.description
											? "text-red-400"
											: "text-gray-400 group-focus-within/input:text-blue-600"
									)}
									size={22}
									strokeWidth={2}
								/>
							</div>

							<textarea
								{...register("description")}
								rows={10}
								placeholder="Nhập mô tả chi tiết sản phẩm (Chất liệu, kích thước, bảo quản...)"
								className={clsx(
									"w-full pl-12 pr-4 py-4 text-base text-gray-800 bg-gray-50/50 border-2 rounded-xl outline-none transition-all resize-y min-h-[200px]",
									"placeholder:text-gray-400",
									"focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
									errors.description
										? "border-red-500 bg-red-50"
										: "border-gray-100 hover:border-blue-200"
								)}
							/>
						</div>

						{errors.description && (
							<p className="text-xs text-red-500 mt-1.5 ml-1 font-medium flex items-center gap-1">
								<span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
								{errors.description.message as string}
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
