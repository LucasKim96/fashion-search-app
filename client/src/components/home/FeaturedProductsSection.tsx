"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { usePublicProducts } from "@shared/features/product/usePublicProducts.hook";
import {
	PublicProductCard,
	ProductCardSkeleton,
} from "@shared/features/product/components/PublicProductCard";

export const FeaturedProductsSection = () => {
	const { products, loading, error } = usePublicProducts({ limit: 8 });

	return (
		<section className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-10">
			<div className="flex items-end justify-between mb-10 border-b border-gray-100 pb-4">
				<div>
					<h2 className="text-3xl font-extrabold text-secondary-dark tracking-tight">
						Sản phẩm mới nhất
					</h2>
					<div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
				</div>

				<a
					href="/products"
					className="group text-sm font-bold text-secondary hover:text-primary-dark flex items-center transition-colors px-4 py-2 rounded-full hover:bg-gray-50">
					Xem tất cả
					<span className="ml-2 bg-secondary text-white rounded-full p-0.5 group-hover:bg-primary group-hover:text-black transition-colors">
						<ChevronRight size={14} />
					</span>
				</a>
			</div>

			{error && <p className="text-error text-center font-medium">{error}</p>}

			<div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
				{loading
					? [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
					: products.map((product) => (
							<PublicProductCard key={product._id} product={product} />
					  ))}
			</div>
		</section>
	);
};
