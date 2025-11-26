"use client";

import React from "react";
import Link from "next/link";
import { Shirt, BadgeCheck } from "lucide-react"; // Thêm icon check cho độ giống
import { buildImageUrl, formatCurrency } from "@shared/core/utils";
import { ProductListItem, Product } from "@shared/features/product";
import { ProductSearchResult } from "@shared/features/search";

interface PublicProductCardProps {
	// Chấp nhận tất cả các kiểu dữ liệu sản phẩm
	product: ProductListItem | ProductSearchResult | Product;
}

export const PublicProductCard: React.FC<PublicProductCardProps> = ({
	product,
}) => {
	// --- 1. XỬ LÝ DỮ LIỆU ĐA HÌNH (POLYMORPHISM) ---

	// Lấy tên: Ưu tiên 'name' (ListItem), nếu không có thì lấy 'pdName' (Product)
	// Dùng ép kiểu (product as any) để TS không báo lỗi khi truy cập thuộc tính của type kia
	const displayName =
		(product as any).name || (product as any).pdName || "Sản phẩm";

	// Lấy ảnh: Ưu tiên 'thumbnail' (ListItem), nếu không có thì lấy ảnh đầu tiên trong 'images' (Product)
	const displayImage =
		(product as any).thumbnail ||
		((product as any).images && (product as any).images.length > 0
			? (product as any).images[0]
			: null);

	// Kiểm tra xem có phải kết quả Search không để hiện % giống
	const isSearchResult = "similarity" in product;
	// Ép kiểu về ProductSearchResult để lấy similarity
	const similarity = isSearchResult
		? (product as ProductSearchResult).similarity
		: 0;

	return (
		<Link
			href={`/products/${product._id}`}
			className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
			{/* --- 2. IMAGE CONTAINER --- */}
			<div
				className="w-full relative bg-gray-200 overflow-hidden"
				style={{ paddingTop: "100%" }}>
				{displayImage ? (
					<img
						src={buildImageUrl(displayImage)}
						alt={displayName}
						className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
						loading="lazy"
					/>
				) : (
					<div className="absolute inset-0 h-full w-full flex items-center justify-center bg-gray-200">
						<Shirt className="w-16 h-16 text-gray-400" strokeWidth={1} />
					</div>
				)}

				{/* --- 3. BADGE ĐỘ GIỐNG (Chỉ hiện khi tìm kiếm bằng ảnh) --- */}
				{isSearchResult && (
					<div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-[10px] font-bold text-white shadow-md">
						<BadgeCheck size={12} />
						{Math.round(similarity * 100)}%
					</div>
				)}
			</div>

			{/* --- 4. PRODUCT INFO --- */}
			<div className="flex flex-1 flex-col space-y-2 p-4">
				<h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px]">
					{displayName}
				</h3>
				<div className="flex flex-1 flex-col justify-end">
					<p className="text-base font-bold text-red-600">
						{formatCurrency(product.basePrice)}
					</p>
				</div>
			</div>
		</Link>
	);
};

export const ProductCardSkeleton: React.FC = () => {
	return (
		<div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white animate-pulse">
			<div className="w-full bg-gray-200" style={{ paddingTop: "100%" }}></div>
			<div className="flex flex-1 flex-col space-y-3 p-4">
				<div className="h-5 w-3/4 bg-gray-200 rounded"></div>
				<div className="h-4 w-1/4 bg-gray-200 rounded"></div>
				<div className="flex flex-1 flex-col justify-end">
					<div className="h-6 w-1/2 bg-gray-200 rounded"></div>
				</div>
			</div>
		</div>
	);
};

// "use client";

// import React from "react";
// import Link from "next/link";
// import { Shirt } from "lucide-react";
// import { buildImageUrl, formatCurrency } from "@shared/core";

// import { ProductListItem } from "@shared/features/product";

// interface PublicProductCardProps {
// 	product: ProductListItem;
// }

// export const PublicProductCard: React.FC<PublicProductCardProps> = ({
// 	product,
// }) => {
// 	return (
// 		<Link
// 			href={`/products/${product._id}`}
// 			className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
// 			{/* 1. IMAGE CONTAINER */}
// 			<div
// 				className="w-full relative bg-gray-200 overflow-hidden"
// 				style={{ paddingTop: "100%" }}>
// 				{product.thumbnail ? (
// 					<img
// 						src={buildImageUrl(product.thumbnail)}
// 						alt={product.name}
// 						className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
// 						loading="lazy"
// 					/>
// 				) : (
// 					<div className="absolute inset-0 h-full w-full flex items-center justify-center bg-gray-200">
// 						<Shirt className="w-16 h-16 text-gray-400" strokeWidth={1} />
// 					</div>
// 				)}

// 				{/* Đã xóa overlay Cart/Heart theo yêu cầu */}
// 			</div>

// 			{/* 2. PRODUCT INFO */}
// 			<div className="flex flex-1 flex-col space-y-2 p-4">
// 				<h3 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
// 					{product.name}
// 				</h3>
// 				<div className="flex flex-1 flex-col justify-end">
// 					<p className="text-base font-semibold text-gray-900">
// 						{formatCurrency(product.basePrice)}
// 					</p>
// 				</div>
// 			</div>
// 		</Link>
// 	);
// };

// export const ProductCardSkeleton: React.FC = () => {
// 	return (
// 		<div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white animate-pulse">
// 			<div className="w-full bg-gray-200" style={{ paddingTop: "100%" }}></div>
// 			<div className="flex flex-1 flex-col space-y-3 p-4">
// 				<div className="h-5 w-3/4 bg-gray-200 rounded"></div>
// 				<div className="h-4 w-1/4 bg-gray-200 rounded"></div>
// 				<div className="flex flex-1 flex-col justify-end">
// 					<div className="h-6 w-1/2 bg-gray-200 rounded"></div>
// 				</div>
// 			</div>
// 		</div>
// 	);
// };
