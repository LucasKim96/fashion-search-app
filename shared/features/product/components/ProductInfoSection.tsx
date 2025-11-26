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
	Layers,
	Check,
	Sparkles,
	Shirt,
	Scissors,
	ShoppingCart,
	Box,
} from "lucide-react";
import clsx from "clsx";
import { useProduct, ProductDetail, ProductVariantDetail } from "../index";
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
	onVariantSelect?: (variant: ProductVariantDetail | null) => void;
	currentStock?: number | null;
	onAddToCart?: () => void;
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
	onVariantSelect,
	currentStock,
	onAddToCart,
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

	const [selectedOptions, setSelectedOptions] = useState<
		Record<string, string>
	>({});

	// --- BỔ SUNG: Logic gom nhóm thuộc tính từ variants ---
	const groupedAttributes = useMemo(() => {
		if (!product || !product.variants) return {};

		// Dùng Set để loại bỏ các giá trị trùng lặp (VD: nhiều size cùng màu Đỏ)
		const groups: Record<string, Set<string>> = {};

		product.variants.forEach((variant) => {
			variant.attributes.forEach((attr) => {
				const label = attr.attributeLabel;
				const value = attr.valueLabel;

				// Chỉ lấy khi có đủ tên và giá trị
				if (label && value) {
					if (!groups[label]) {
						groups[label] = new Set();
					}
					groups[label].add(value);
				}
			});
		});

		// Chuyển Set thành Array để hiển thị
		const result: Record<string, string[]> = {};
		Object.keys(groups).forEach((key) => {
			result[key] = Array.from(groups[key]);
		});

		return result;
	}, [product]);

	const handleOptionClick = (label: string, value: string) => {
		const newOptions = { ...selectedOptions };

		// Nếu đang chọn cái này rồi -> Click lại thì bỏ chọn (toggle)
		if (newOptions[label] === value) {
			delete newOptions[label];
		} else {
			// Nếu chưa chọn -> Chọn nó (sẽ tự đè value cũ của label này)
			newOptions[label] = value;
		}

		setSelectedOptions(newOptions);

		// --- TÌM BIẾN THỂ KHỚP (MATCHING VARIANT) ---
		if (product?.variants && onVariantSelect) {
			// Logic tìm: Variant phải chứa TẤT CẢ các cặp (label, value) đang chọn
			// Và số lượng attribute của variant phải bằng số lượng attribute user đã chọn
			// (Để tránh trường hợp user mới chọn "Màu" mà đã match variant có "Màu + Size")

			// Tuy nhiên, logic phổ biến là: Tìm variant khớp nhất.
			// Ở đây ta tìm variant khớp hoàn toàn với các key đã chọn.

			const matchedVariant = product.variants.find((variant) => {
				// Kiểm tra xem variant này có thỏa mãn tất cả option đang chọn không
				const isMatch = Object.entries(newOptions).every(
					([selLabel, selValue]) => {
						return variant.attributes.some(
							(attr) =>
								attr.attributeLabel === selLabel && attr.valueLabel === selValue
						);
					}
				);

				// Kiểm tra chiều ngược lại: Variant này có bao nhiêu attribute?
				// Nếu user chọn full attributes thì mới trả về variant cuối cùng
				const variantAttrCount = variant.attributes.filter(
					(a) => a.attributeLabel && a.valueLabel
				).length;
				const selectedCount = Object.keys(newOptions).length;

				return isMatch && variantAttrCount === selectedCount;
			});

			onVariantSelect(matchedVariant || null);
		}
	};
	// --- LOGIC HIỂN THỊ TỒN KHO ---
	// Nếu cha truyền currentStock -> dùng nó (đã chọn variant)
	// Nếu không -> Tính tổng (chưa chọn variant)
	const displayStock = useMemo(() => {
		if (currentStock !== undefined && currentStock !== null)
			return currentStock;
		if (!product || !product.variants) return 0;
		return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
	}, [product, currentStock]);

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
							{mode !== "create" && (
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
							)}

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
							<label className="block text-base font-bold text-indigo-700 uppercase tracking-wider mb-2 ml-1">
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
										"w-full pl-12 pr-4 py-3.5 text-lg font-bold text-gray-700 bg-gray-50/50 border-2 rounded-xl outline-none transition-all",
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
									<label className="block text-base font-bold text-indigo-700 uppercase tracking-wider mb-2 ml-1">
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
				{/* --- 3. AI CROP SELECTION (CHỈ HIỆN KHI CREATE) --- */}
				{currentMode === "create" && (
					<div className="mt-2  bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-4 rounded-2xl relative overflow-hidden group">
						{/* Background Decoration */}
						<Sparkles
							className="absolute -top-2 -right-2 text-indigo-400 opacity-20 rotate-12 group-hover:rotate-45 transition-transform duration-700"
							size={80}
						/>

						{/* Intro Text */}
						<div className="flex items-start gap-3 mb-4 relative z-10 ">
							{/* <div className="bg-indigo-500 text-white p-2 rounded-full shadow-md shrink-0">
								<Sparkles size={18} />
							</div> */}
							<div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white shrink-0">
								<Sparkles
									size={18}
									fill="currentColor"
									className="opacity-90"
								/>
							</div>
							<div>
								<h4 className="text-base font-bold text-indigo-700 mb-1">
									Smart Search Assistant
								</h4>
								<p className="text-sm text-indigo-800/80 leading-relaxed">
									Hệ thống sẽ phân tích hình ảnh để đưa ra những gợi ý tìm kiếm
									phù hợp nhất về sản phẩm của bạn. Chọn đúng loại trang phục sẽ
									giúp sản phẩm của bạn nổi bật hơn và dễ đến tay người tiêu
									dùng hơn.
								</p>
							</div>
						</div>

						{/* Selection Buttons */}
						<Controller
							name="targetGroup"
							control={control}
							defaultValue="full_body" // Mặc định
							render={({ field: { onChange, value } }) => (
								<div className="grid grid-cols-3 gap-3 relative z-10">
									<button
										type="button"
										onClick={() => onChange("upper_body")}
										className={clsx(
											"flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-200",
											value === "upper_body"
												? "bg-white border-indigo-500 shadow-md -translate-y-0.5"
												: "bg-white/50 border-transparent hover:bg-white hover:border-indigo-200"
										)}>
										<Shirt
											size={24}
											className={
												value === "upper_body"
													? "text-indigo-600"
													: "text-indigo-400"
											}
										/>
										<span
											className={clsx(
												"text-sm font-bold",
												value === "upper_body"
													? "text-indigo-700"
													: "text-indigo-500"
											)}>
											Áo
										</span>
									</button>

									<button
										type="button"
										onClick={() => onChange("lower_body")}
										className={clsx(
											"flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-200",
											value === "lower_body"
												? "bg-white border-indigo-500 shadow-md -translate-y-0.5"
												: "bg-white/50 border-transparent hover:bg-white hover:border-indigo-200"
										)}>
										{/* Icon Quần/Váy */}
										<Scissors
											size={24}
											className={
												value === "lower_body"
													? "text-indigo-600"
													: "text-indigo-400"
											}
										/>
										<span
											className={clsx(
												"text-sm font-bold",
												value === "lower_body"
													? "text-indigo-700"
													: "text-indigo-500"
											)}>
											Quần/Váy
										</span>
									</button>

									<button
										type="button"
										onClick={() => onChange("full_body")}
										className={clsx(
											"flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-200",
											value === "full_body"
												? "bg-white border-indigo-500 shadow-md -translate-y-0.5"
												: "bg-white/50 border-transparent hover:bg-white hover:border-indigo-200"
										)}>
										<Layers
											size={24}
											className={
												value === "full_body"
													? "text-indigo-600"
													: "text-indigo-400"
											}
										/>
										<span
											className={clsx(
												"text-sm font-bold",
												value === "full_body"
													? "text-indigo-700"
													: "text-indigo-500"
											)}>
											Cả bộ
										</span>
									</button>
								</div>
							)}
						/>
					</div>
				)}
				{/* 4. DASHBOARD INFO (Grid Layout) */}

				{/* --- BỔ SUNG 1: HIỂN THỊ TỒN KHO --- */}
				{!isShop && !isAdmin && currentMode === "view" && (
					<div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 w-fit">
						<div className="p-2 bg-white rounded-lg shadow-sm text-blue-500">
							<Box size={20} />
						</div>
						<div>
							<p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
								{/* Logic đổi text: Đã chọn đủ option chưa? */}
								{Object.keys(selectedOptions).length > 0 &&
								Object.keys(selectedOptions).length ===
									Object.keys(groupedAttributes).length
									? "Tồn kho phiên bản này"
									: "Tổng tồn kho"}
							</p>
							<p className="text-lg font-bold text-gray-800">
								{new Intl.NumberFormat("vi-VN").format(displayStock)}{" "}
								<span className="text-sm font-normal text-gray-500">
									sản phẩm
								</span>
							</p>
						</div>
					</div>
				)}
				{/* GIỎ HÀNG */}
				{/* Chỉ hiện khi: KHÔNG phải Shop, KHÔNG phải Admin, và đang ở chế độ View */}
				{!isShop && !isAdmin && currentMode === "view" && (
					<div className="mt-6 pt-6 border-t border-gray-100">
						<button
							onClick={onAddToCart}
							disabled={displayStock === 0} // Hết hàng thì disable
							className={clsx(
								"w-full py-4 font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3",
								"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
								// Style: Màu vàng (Primary) chữ đen
								"bg-primary hover:bg-primary-light text-black"
							)}>
							<ShoppingCart size={24} />
							{displayStock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
						</button>
					</div>
				)}

				{(isShop || isAdmin) && currentMode === "view" && product && (
					<div className="grid grid-cols-2 gap-4 mt-2">
						{/* Box 1: Trạng thái */}
						<DashboardBox
							color="emerald"
							icon={Tag}
							label="Trạng thái"
							value={product.isActive ? "Đang bán" : "Đang ẩn"}
						/>
						{/* Box 2: Tồn kho */}
						<DashboardBox
							color="blue"
							icon={Warehouse}
							label="Tổng tồn kho"
							value={`${totalStock} SP`}
						/>
						{/* Box 3: Ngày tạo */}
						<DashboardBox
							color="orange"
							icon={Calendar}
							label="Ngày tạo"
							value={new Date(product.createdAt).toLocaleDateString("vi-VN")}
						/>
						{/* Box 4: Cập nhật */}
						<DashboardBox
							color="purple"
							icon={Clock}
							label="Cập nhật cuối"
							value={new Date(product.updatedAt).toLocaleDateString("vi-VN")}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
// Component phụ cho đẹp code Dashboard
const DashboardBox: React.FC<{
	color: string;
	icon: any;
	label: React.ReactNode;
	value: React.ReactNode;
}> = ({ color, icon: Icon, label, value }) => {
	const outerClass =
		"group relative overflow-hidden p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1";

	const circleClass =
		"absolute top-0 right-0 w-24 h-24 " +
		"bg-" +
		color +
		"-400 rounded-full -mr-10 -mt-10 opacity-20 transition-transform duration-500 group-hover:scale-125";

	const boxInnerClass =
		"w-14 h-14 rounded-2xl bg-gradient-to-br " +
		"from-" +
		color +
		"-50 to-" +
		color +
		"-100 text-" +
		color +
		"-600 flex items-center justify-center shadow-inner";

	return (
		<div className={outerClass}>
			<div className={circleClass} />
			<div className="relative flex items-center gap-4">
				<div className={boxInnerClass}>
					<Icon size={24} strokeWidth={2} className="drop-shadow-sm" />
				</div>
				<div className="flex flex-col">
					<span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
						{label}
					</span>
					<span className="text-base font-black text-gray-800 tracking-tight">
						{value}
					</span>
				</div>
			</div>
		</div>
	);
};
