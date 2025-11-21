"use client";

import React from "react";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { buildImageUrl, formatCurrency } from "@shared/core";
import { ProductListItem } from "@shared/features/product";

interface PublicProductCardProps {
	product: ProductListItem;
}

export const PublicProductCard: React.FC<PublicProductCardProps> = ({
	product,
}) => {
	return (
		<Link
			href={`/products/${product._id}`}
			className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
			{/* 1. IMAGE CONTAINER */}
			<div
				className="w-full relative bg-gray-200 overflow-hidden"
				style={{ paddingTop: "100%" }}>
				{product.thumbnail ? (
					<img
						src={buildImageUrl(product.thumbnail)}
						alt={product.name}
						className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
						loading="lazy"
					/>
				) : (
					<div className="absolute inset-0 h-full w-full flex items-center justify-center bg-gray-200">
						<Shirt className="w-16 h-16 text-gray-400" strokeWidth={1} />
					</div>
				)}

				{/* Đã xóa overlay Cart/Heart theo yêu cầu */}
			</div>

			{/* 2. PRODUCT INFO */}
			<div className="flex flex-1 flex-col space-y-2 p-4">
				<h3 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
					{product.name}
				</h3>
				<div className="flex flex-1 flex-col justify-end">
					<p className="text-base font-semibold text-gray-900">
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
