"use client";

import React from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { formatCurrency } from "@shared/core/utils";
import { ImageWithFallback } from "@shared/core/components/ui/ImageWithFallback"; // Import component tái sử dụng
import { ProductListItem, Product } from "@shared/features/product";
import { ProductSearchResult } from "@shared/features/search";

interface PublicProductCardProps {
	product: ProductListItem | ProductSearchResult | Product;
}

export const PublicProductCard: React.FC<PublicProductCardProps> = ({
	product,
}) => {
	// --- XỬ LÝ DỮ LIỆU ĐA HÌNH ---
	// Ép kiểu an toàn để lấy tên và ảnh từ các loại object khác nhau
	const p = product as any;

	const displayName = p.name || p.pdName || "Sản phẩm";

	const Image = `/uploads/products/${p.matchedImage}`;
	const displayImage =
		p.thumbnail ||
		Image ||
		(p.images && p.images.length > 0 ? p.images[0] : "");

	// Xử lý riêng cho kết quả tìm kiếm
	const isSearchResult = "similarity" in product;
	const similarity = isSearchResult
		? (product as ProductSearchResult).similarity
		: 0;

	return (
		<Link
			href={`/products/${product._id}`}
			className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1">
			{/* --- IMAGE CONTAINER --- */}
			<div
				className="w-full relative bg-gray-100 overflow-hidden"
				style={{ paddingTop: "100%" }} // Aspect ratio 1:1
			>
				{/* Dùng div absolute để ảnh fill đầy khung tỷ lệ 1:1 */}
				<div className="absolute inset-0">
					<ImageWithFallback
						src={displayImage}
						alt={displayName}
						className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
					/>
				</div>

				{/* Badge độ giống (Chỉ hiện khi search bằng ảnh) */}
				{isSearchResult && (
					<div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-[10px] font-bold text-white shadow-md">
						<BadgeCheck size={12} />
						{Math.round(similarity * 100)}%
					</div>
				)}
			</div>

			{/* --- PRODUCT INFO --- */}
			<div className="flex flex-1 flex-col space-y-2 p-4">
				<h3
					className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px]"
					title={displayName}>
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
