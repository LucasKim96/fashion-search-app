"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Loader2, Shirt, ImageIcon } from "lucide-react";
import { buildImageUrl, formatCurrency, useNotification } from "@shared/core";
import { ProductListItem } from "@shared/features/product";
import { useCart } from "@shared/features/cart";

interface PublicProductCardProps {
	product: ProductListItem;
}

export const PublicProductCard: React.FC<PublicProductCardProps> = ({
	product,
}) => {
	const router = useRouter();
	const { addItemToCart, isAdding } = useCart();
	const { showToast } = useNotification();
	const [isLiking, setIsLiking] = useState(false);

	const handleCardClick = () => {
		router.push(`/products/${product._id}`);
	};

	const handleAddToCart = async (e: React.MouseEvent) => {
		e.stopPropagation();
		const defaultVariantId = (product as any).defaultVariantId;
		if (!defaultVariantId) {
			showToast("Vui lòng vào trang chi tiết để chọn phiên bản", "info");
			handleCardClick();
			return;
		}
		const res = await addItemToCart({
			productVariantId: defaultVariantId,
			quantity: 1,
		});
		if (res.success) {
			showToast("Đã thêm sản phẩm vào giỏ hàng!", "success");
		}
	};

	const handleAddToWishlist = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsLiking(true);
		await new Promise((resolve) => setTimeout(resolve, 500));
		showToast("Đã thêm vào danh sách yêu thích!", "success");
		setIsLiking(false);
	};

	return (
		<div
			// onClick={handleCardClick}
			className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
			{/* Image Container */}
			<div
				className="w-full relative bg-gray-200"
				style={{ paddingTop: "100%" }}>
				{product.thumbnail ? (
					// 2. Ảnh sẽ được đặt tuyệt đối để lấp đầy khung
					<img
						src={buildImageUrl(product.thumbnail)}
						alt={product.name}
						className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
						loading="lazy"
					/>
				) : (
					// Icon cũng được đặt tuyệt đối để lấp đầy khung
					<div className="absolute inset-0 h-full w-full flex items-center justify-center bg-gray-200">
						<Shirt className="w-16 h-16 text-gray-400" strokeWidth={1} />
					</div>
				)}
				{/* Overlay actions (giữ nguyên, nó đã được đặt `absolute` nên sẽ nằm trên cùng) */}
				<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-10">
					<button
						onClick={handleAddToCart}
						disabled={isAdding}
						className="p-3 w-[44px] h-[44px] flex items-center justify-center bg-white/80 rounded-full text-gray-700 hover:bg-white hover:text-primary backdrop-blur-sm scale-90 group-hover:scale-100 transition-all duration-200 delay-100 disabled:opacity-50">
						{isAdding ? (
							<Loader2 className="animate-spin" size={20} />
						) : (
							<ShoppingCart size={20} />
						)}
					</button>
					<button
						onClick={handleAddToWishlist}
						disabled={isLiking}
						className="p-3 w-[44px] h-[44px] flex items-center justify-center bg-white/80 rounded-full text-gray-700 hover:bg-white hover:text-red-500 backdrop-blur-sm scale-90 group-hover:scale-100 transition-all duration-200 delay-200 disabled:opacity-50">
						{isLiking ? (
							<Loader2 className="animate-spin" size={20} />
						) : (
							<Heart size={20} />
						)}
					</button>
				</div>
			</div>
			{/* Product Info */}
			<div className="flex flex-1 flex-col space-y-2 p-4">
				<h3 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
					<a
						href={`/products/${product._id}`}
						onClick={(e) => {
							e.preventDefault();
							handleCardClick();
						}}
					/>
					<span aria-hidden="true" className="absolute inset-0" />
					{product.name}
				</h3>
				<div className="flex flex-1 flex-col justify-end">
					<p className="text-base font-semibold text-gray-900">
						{formatCurrency(product.basePrice)}
					</p>
				</div>
			</div>
		</div>
	);
};

export const ProductCardSkeleton: React.FC = () => {
	return (
		<div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white animate-pulse">
			{/* Áp dụng `aspect-square` cho cả skeleton */}
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
