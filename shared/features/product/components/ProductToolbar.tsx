"use client";

import React from "react";
import clsx from "clsx";
import {
	Plus,
	Grid,
	Tag,
	Coins,
	CreditCard,
	Banknote,
	Gem,
	Filter,
	Package,
	CheckCircle,
	CirclePoundSterling,
} from "lucide-react";
import { SearchHeader, GradientButton } from "@shared/core";
import { ProductSearchRequest } from "@shared/features/product";

// Danh sách bộ lọc giá (Di chuyển ra ngoài để dùng chung)
const priceFilters = [
	{
		label: "Tất cả mức giá",
		value: undefined,
		color: "from-gray-400 via-gray-350 to-gray-600",
		icon: <Grid size={16} />,
	},
	{
		label: "Dưới 100k",
		value: "<100",
		color: "from-blue-400 via-blue-500 to-blue-600",
		icon: <CirclePoundSterling size={16} />,
	},
	{
		label: "100k - 300k",
		value: "100-300",
		color: "from-cyan-400 via-cyan-500 to-cyan-600",
		icon: <Coins size={16} />,
	},
	{
		label: "300k - 500k",
		value: "300-500",
		color: "from-teal-400 via-teal-500 to-teal-600",
		icon: <Banknote size={16} />,
	},
	{
		label: "500k - 1 triệu",
		value: "500-1000",
		color: "from-indigo-400 via-indigo-500 to-indigo-600",
		icon: <CreditCard size={16} />,
	},
	{
		label: "Trên 1 triệu",
		value: "1000<",
		color: "from-purple-400 via-purple-500 to-purple-600",
		icon: <Gem size={16} />,
	},
];

interface ProductToolbarProps {
	// Search Props
	searchQuery: string;
	onSearchChange: (value: string) => void;

	// Filter Props
	selectedPriceRange: ProductSearchRequest["priceRange"] | undefined;
	onPriceRangeChange: (
		value: ProductSearchRequest["priceRange"] | undefined
	) => void;

	// Stats Props
	stats: {
		total: number;
		active: number;
	};

	// Action Props
	onCreateClick: () => void;
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
	searchQuery,
	onSearchChange,
	selectedPriceRange,
	onPriceRangeChange,
	stats,
	onCreateClick,
}) => {
	return (
		<div className="flex flex-col gap-4">
			{/* 1. Header với Search */}
			<SearchHeader
				title="QUẢN LÝ SẢN PHẨM"
				searchPlaceholder="Tìm kiếm theo tên sản phẩm..."
				searchValue={searchQuery}
				onSearchChange={onSearchChange}
			/>

			{/* 2. Bộ lọc + Nút tạo */}
			<div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
				{/* Filter */}
				<div className="flex flex-col gap-2 flex-1">
					<div className="flex items-center gap-2 text-gray-600">
						<Filter size={18} />
						<span className="text-sm font-semibold">Lọc theo khoảng giá:</span>
					</div>
					<div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-2xl shadow-inner border border-gray-200">
						{priceFilters.map((item) => (
							<button
								key={item.label}
								onClick={() =>
									onPriceRangeChange(
										item.value as ProductSearchRequest["priceRange"]
									)
								}
								className={clsx(
									"relative flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm",
									selectedPriceRange === item.value
										? `bg-gradient-to-r ${item.color} text-white shadow-md scale-105`
										: "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
								)}>
								{item.icon}
								{item.label}
							</button>
						))}
					</div>
				</div>

				{/* Nút tạo */}
				<div className="flex-shrink-0 pb-1">
					<GradientButton
						label="Thêm sản phẩm mới"
						icon={Plus}
						gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"
						hoverGradient="hover:from-green-600 hover:to-emerald-700"
						onClick={onCreateClick}
						className="shadow-lg shadow-green-500/30 h-[46px]"
					/>
				</div>
			</div>

			{/* 3. Thống kê số lượng */}
			<div className="flex flex-wrap gap-4 justify-end">
				{/* Card 1: Tổng số lượng */}
				<div className="flex items-center gap-3 bg-white py-3 px-5 rounded-xl border border-gray-200 shadow-sm min-w-[200px]">
					<div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
						<Package size={24} strokeWidth={2} />
					</div>
					<div className="flex flex-col">
						<span className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">
							Tổng số lượng
						</span>
						<div className="flex items-baseline gap-1">
							<span className="text-2xl font-extrabold text-gray-800 leading-none">
								{stats.total}
							</span>
							<span className="text-xs font-medium text-gray-400">
								sản phẩm
							</span>
						</div>
					</div>
				</div>

				{/* Card 2: Đang kinh doanh */}
				<div className="flex items-center gap-3 bg-white py-3 px-5 rounded-xl border border-gray-200 shadow-sm min-w-[200px]">
					<div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
						<CheckCircle size={24} strokeWidth={2} />
					</div>
					<div className="flex flex-col">
						<span className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">
							Đang kinh doanh
						</span>
						<div className="flex items-baseline gap-1">
							<span className="text-2xl font-extrabold text-emerald-600 leading-none">
								{stats.active}
							</span>
							<span className="text-xs font-medium text-gray-400">
								khả dụng
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
