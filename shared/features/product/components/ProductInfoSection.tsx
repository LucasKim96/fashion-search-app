"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import {
	Edit,
	DollarSign,
	Save,
	X,
	Calendar,
	Clock,
	Tag,
	Warehouse,
} from "lucide-react";
import clsx from "clsx";
import { useProduct, ProductDetail } from "../index";
import { GradientButton, Input, formatCurrency } from "@shared/core";

interface ProductInfoSectionProps {
	formId?: string;
	// productId?: string;
	product: ProductDetail | null;
	mode?: "view" | "create" | "edit";
	isShop?: boolean;
	isAdmin?: boolean;
	// onVariantClick?: () => void;
	onCancelEdit?: () => void;
	onEditClick?: () => void;
}

export const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
	formId,
	product,
	// productId,
	mode = "view",
	isShop = false,
	isAdmin = false,
	// onVariantClick,
	onCancelEdit,
	onEditClick,
}) => {
	// Dùng form context của cha
	const {
		register,
		control,
		formState: { errors, isSubmitting },
	} = useFormContext();

	// State nội bộ để quản lý chế độ View/Edit (khi mode="view" ban đầu)
	const [currentMode, setCurrentMode] = useState(mode);

	// Đồng bộ mode từ props cha truyền xuống
	useEffect(() => {
		setCurrentMode(mode);
	}, [mode]);

	const handleEditClick = () => onEditClick?.();

	// Xử lý hủy
	const handleCancel = () => {
		if (mode === "create") {
			onCancelEdit?.();
		} else {
			onCancelEdit?.();
			// Việc reset form Cha làm khi bấm Hủy
		}
	};
	// --- TÍNH TỔNG TỒN KHO ---
	const totalStock = useMemo(() => {
		if (!product || !product.variants) return 0;
		return product.variants.reduce(
			(sum, variant) => sum + (variant.stock || 0),
			0
		);
	}, [product]);

	if (!product && mode !== "create")
		return <div className="h-32 animate-pulse bg-gray-100 rounded-xl" />;

	// --- RENDER ---
	return (
		<div className="relative flex flex-col gap-4 h-full">
			{/* --- HEADER ACTION BUTTONS (Góc trên phải) --- */}
			{isShop && (
				<div className="absolute top-0 right-0 flex gap-2 z-10">
					{currentMode === "view" ? (
						<>
							<GradientButton
								onClick={handleEditClick}
								icon={Edit}
								label="Chỉnh sửa"
								iconColor="text-white"
								labelColor="text-white"
								gradient="bg-gradient-to-r from-yellow-400 to-orange-500"
								hoverGradient="hover:from-yellow-500 hover:to-orange-600"
								className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
								roundedFull
								shadow
							/>
							{/* <GradientButton
								onClick={onVariantClick}
								icon={Plus}
								label="Biến thể"
								className="!px-3 !py-1.5"
							/> */}
						</>
					) : (
						// Mode Edit hoặc Create -> Hiện nút Lưu & Hủy
						<>
							<GradientButton
								type="button" // Nút Hủy không submit form
								onClick={handleCancel}
								icon={X}
								label="Hủy"
								gradient="bg-red-50 hover:bg-red-100"
								labelColor="text-red-700"
								iconColor="text-red-700"
								className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
								roundedFull
								shadow
							/>
							<GradientButton
								form={formId}
								type="submit" // Nút Lưu submit form
								loading={isSubmitting}
								icon={Save}
								label="Lưu"
								iconColor="text-white"
								labelColor="text-white"
								// gradient="bg-gradient-to-r from-yellow-400 to-orange-500"
								// hoverGradient="hover:from-yellow-500 hover:to-orange-600"
								className="flex items-center gap-2 px-3 py-1 text-sm shadow-md"
								roundedFull
								shadow
							/>
						</>
					)}
				</div>
			)}

			{/* --- MAIN CONTENT --- */}
			<div
				className={clsx(
					"flex flex-col gap-6 transition-all duration-300",
					isShop && "pt-10"
				)}>
				<div className="group relative">
					{currentMode === "view" ? (
						<div className="relative pl-3 border-l-4 border-indigo-500 transition-all hover:border-indigo-400">
							<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
								Tên sản phẩm
							</span>
							<h2 className="text-3xl font-black text-gray-800 leading-tight tracking-tight pr-10 break-words">
								{product?.pdName}
							</h2>
							{/* Decorative Background Icon */}
							<Tag
								className="absolute right-0 top-0 text-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-2"
								size={60}
								strokeWidth={1}
							/>
						</div>
					) : (
						<div className="relative group/input">
							<label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
								Tên sản phẩm
							</label>
							<div className="relative transition-all duration-300 focus-within:-translate-y-1 focus-within:shadow-lg rounded-xl">
								<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Tag
										className={clsx(
											"transition-colors duration-300",
											errors.pdName
												? "text-red-400"
												: "text-indigo-400 group-focus-within/input:text-indigo-600"
										)}
										size={20}
									/>
								</div>
								<input
									placeholder="Nhập tên sản phẩm..."
									{...register("pdName", {
										required: "Tên sản phẩm là bắt buộc",
									})}
									className={clsx(
										"w-full pl-12 pr-4 py-3.5 text-lg font-bold text-gray-800 bg-gray-50/50 border-2 rounded-xl outline-none transition-all",
										"placeholder:text-gray-300",
										"focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
										errors.pdName
											? "border-red-500 bg-red-50"
											: "border-gray-100 hover:border-indigo-200"
									)}
								/>
							</div>
							{errors.pdName && (
								<p className="text-xs text-red-500 mt-1.5 ml-1 font-medium flex items-center gap-1">
									<span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
									{errors.pdName.message as string}
								</p>
							)}
						</div>
					)}
				</div>

				{/* 2. GIÁ BÁN */}
				<div>
					{currentMode === "view" ? (
						<div className="relative pl-3 border-l-4 border-red-500 transition-all hover:border-red-400">
							<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
								Giá niêm yết
							</span>
							<div className="flex items-baseline gap-2">
								<p className="text-4xl font-black  text-red-600 drop-shadow-sm">
									{formatCurrency(product?.basePrice)}
								</p>
							</div>
						</div>
					) : (
						<Controller
							name="basePrice"
							control={control}
							rules={{
								required: "Giá là bắt buộc",
								min: { value: 1000, message: "Tối thiểu 1.000đ" },
							}}
							render={({ field: { onChange, value } }) => (
								<div className="relative group/input">
									<label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
										Giá bán (VNĐ)
									</label>

									<div className="relative transition-all duration-300 focus-within:-translate-y-1 focus-within:shadow-lg rounded-xl">
										<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
											<DollarSign
												className={clsx(
													"transition-colors duration-300",
													errors.basePrice
														? "text-red-400"
														: "text-emerald-500 group-focus-within/input:text-emerald-600"
												)}
												size={22}
												strokeWidth={2.5}
											/>
										</div>
										<input
											type="number"
											className={clsx(
												"w-full pl-12 pr-4 py-3.5 text-2xl font-bold text-emerald-700 bg-emerald-50/30 border-2 rounded-xl outline-none transition-all",
												"placeholder:text-emerald-200",
												"focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10",
												errors.basePrice
													? "border-red-500"
													: "border-emerald-100 hover:border-emerald-300"
											)}
											placeholder="0"
											value={value === 0 ? "" : value}
											onChange={(e) => {
												const val = e.target.value;
												onChange(val === "" ? 0 : Number(val));
											}}
											step={1000}
											min={0}
										/>
										{/* Helper text hiển thị format */}
										<div className="pr-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-200 group-focus-within/input:opacity-100 opacity-60">
											<span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
												{value > 0 ? formatCurrency(value) : "0 ₫"}
											</span>
										</div>
									</div>

									{errors.basePrice && (
										<p className="text-xs text-red-500 mt-1.5 ml-1 font-medium flex items-center gap-1">
											<span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
											{errors.basePrice.message as string}
										</p>
									)}
								</div>
							)}
						/>
					)}
				</div>

				{/* 3. DASHBOARD INFO (Grid Layout) */}
				{/* Chỉ hiển thị ở chế độ View của Shop để thông tin gọn gàng */}
				{(isShop || isAdmin) && currentMode === "view" && product && (
					<div className="grid grid-cols-2 gap-4 mt-4">
						{/* 1. TRẠNG THÁI */}
						<div className="group relative overflow-hidden p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1">
							<div
								className={clsx(
									"absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 transition-transform duration-500 opacity-20 group-hover:scale-125",
									product.isActive ? "bg-emerald-400" : "bg-gray-400"
								)}
							/>

							<div className="relative flex items-center gap-4">
								<div
									className={clsx(
										"w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-300",
										product.isActive
											? "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600"
											: "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500"
									)}>
									<Tag size={24} strokeWidth={2} className="drop-shadow-sm" />
								</div>
								<div className="flex flex-col">
									<span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
										Trạng thái
									</span>
									<span
										className={clsx(
											"text-base font-black tracking-tight",
											product.isActive ? "text-emerald-600" : "text-gray-500"
										)}>
										{product.isActive ? "Đang bán" : "Đang ẩn"}
									</span>
								</div>
							</div>
						</div>

						{/* 2. TỔNG TỒN KHO */}
						<div className="group relative overflow-hidden p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1">
							<div className="absolute top-0 right-0 w-24 h-24 bg-blue-400 rounded-full -mr-10 -mt-10 opacity-20 transition-transform duration-500 group-hover:scale-125" />

							<div className="relative flex items-center gap-4">
								<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
									<Warehouse
										size={24}
										strokeWidth={2}
										className="drop-shadow-sm"
									/>
								</div>
								<div className="flex flex-col min-w-0">
									<span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
										Tổng tồn kho
									</span>
									<span className="text-base font-black text-gray-800 truncate tracking-tight">
										{new Intl.NumberFormat("vi-VN").format(totalStock)}{" "}
										<span className="text-xs font-medium text-gray-400 font-sans">
											SP
										</span>
									</span>
								</div>
							</div>
						</div>

						{/* 3. NGÀY TẠO */}
						<div className="group relative overflow-hidden p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1">
							<div className="absolute top-0 right-0 w-24 h-24 bg-orange-400 rounded-full -mr-10 -mt-10 opacity-20 transition-transform duration-500 group-hover:scale-125" />

							<div className="relative flex items-center gap-4">
								<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
									<Calendar
										size={24}
										strokeWidth={2}
										className="drop-shadow-sm"
									/>
								</div>
								<div className="flex flex-col">
									<span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
										Ngày tạo
									</span>
									<span className="text-base font-black text-gray-800 tracking-tight font-mono">
										{new Date(product.createdAt).toLocaleDateString("vi-VN")}
									</span>
								</div>
							</div>
						</div>

						{/* 4. CẬP NHẬT CUỐI */}
						<div className="group relative overflow-hidden p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1">
							<div className="absolute top-0 right-0 w-24 h-24 bg-purple-400 rounded-full -mr-10 -mt-10 opacity-20 transition-transform duration-500 group-hover:scale-125" />

							<div className="relative flex items-center gap-4">
								<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
									<Clock size={24} strokeWidth={2} className="drop-shadow-sm" />
								</div>
								<div className="flex flex-col">
									<span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
										Cập nhật cuối
									</span>
									<span className="text-base font-black text-gray-800 tracking-tight font-mono">
										{new Date(product.updatedAt).toLocaleDateString("vi-VN")}
									</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
