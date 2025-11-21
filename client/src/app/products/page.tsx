"use client";

import React from "react";
import { usePublicProducts } from "@shared/features/product/usePublicProducts.hook";
import {
	PublicProductCard,
	ProductCardSkeleton,
} from "@shared/features/product/components/PublicProductCard";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";

const ProductsPageContent = () => {
	// Tạm thời chưa dùng phân trang, sẽ lấy tất cả sản phẩm
	const { products, loading, error } = usePublicProducts({});

	if (error)
		return <p className="text-red-500 text-center col-span-full">{error}</p>;

	return (
		<div className="grid grid-cols-2 gap-y-10 gap-x-6 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
			{loading
				? [...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)
				: products.map((product) => (
						// Ở đây PublicProductCard không có nút Thêm vào giỏ
						<PublicProductCard key={product._id} product={product} />
				  ))}
		</div>
	);
};

export default function ProductsPage() {
	return (
		<div className="min-h-screen flex flex-col bg-white">
			<ClientHeader />
			<main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
				<div className="mb-8">
					<h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
						Tất cả sản phẩm
					</h1>
					<p className="mt-2 text-lg text-gray-500">
						Khám phá bộ sưu tập thời trang mới nhất của chúng tôi.
					</p>
				</div>

				<div className="flex flex-col lg:flex-row gap-8">
					{/* Filter Sidebar (Tùy chọn, có thể thêm sau) */}
					<aside className="w-full lg:w-64">
						<h2 className="font-semibold text-lg mb-4">Bộ lọc</h2>
						<div className="space-y-4 p-4 border rounded-lg">
							{/* Các tùy chọn filter ở đây */}
							<p className="text-sm text-gray-500">Bộ lọc sẽ sớm ra mắt.</p>
						</div>
					</aside>

					{/* Product Grid */}
					<div className="flex-1">
						<ProductsPageContent />
						{/* Pagination (Tùy chọn, có thể thêm sau) */}
						<div className="mt-12 flex justify-center">
							{/* <Pagination totalPages={...} currentPage={...} onPageChange={...} /> */}
						</div>
					</div>
				</div>
			</main>
			<ClientFooter />
		</div>
	);
}
