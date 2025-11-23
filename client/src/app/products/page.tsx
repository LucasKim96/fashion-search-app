"use client";

import React, { useState, useEffect } from "react";
import { usePublicProducts } from "@shared/features/product/usePublicProducts.hook";
import {
	PublicProductCard,
	ProductCardSkeleton,
} from "@shared/features/product/components/PublicProductCard";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

// --- COMPONENT PHÂN TRANG (UI) ---
interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

const Pagination = ({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationProps) => {
	if (totalPages <= 1) return null;

	return (
		<div className="flex justify-center items-center gap-2 mt-12 animate-fade-in">
			{/* Nút Previous */}
			<button
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
				className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text-muted hover:text-primary">
				<ChevronLeft size={20} />
			</button>

			{/* Các số trang */}
			{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
				// Logic hiển thị rút gọn: Chỉ hiện trang đầu, cuối, và xung quanh trang hiện tại
				// (Ở đây làm đơn giản hiển thị hết nếu ít, hoặc bạn có thể customize thêm logic dấu ...)
				if (
					page === 1 ||
					page === totalPages ||
					(page >= currentPage - 1 && page <= currentPage + 1)
				) {
					return (
						<button
							key={page}
							onClick={() => onPageChange(page)}
							className={clsx(
								"w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 border",
								currentPage === page
									? "bg-primary text-black border-primary shadow-md scale-110" // Active: Màu vàng, chữ đen
									: "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary-dark"
							)}>
							{page}
						</button>
					);
				} else if (page === currentPage - 2 || page === currentPage + 2) {
					return (
						<span key={page} className="px-1 text-gray-400">
							...
						</span>
					);
				}
				return null;
			})}

			{/* Nút Next */}
			<button
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text-muted hover:text-primary">
				<ChevronRight size={20} />
			</button>
		</div>
	);
};

// --- CONTENT CHÍNH ---
const ProductsPageContent = () => {
	// 1. State quản lý trang
	const [page, setPage] = useState(1);
	const LIMIT = 30;

	// 2. Gọi hook với tham số phân trang
	// Lưu ý: Hook usePublicProducts của bạn cần trả về `totalPages` hoặc `total` để tính toán
	const { products, loading, error, totalPages } = usePublicProducts({
		page,
		limit: LIMIT,
	});

	// Scroll lên đầu khi chuyển trang
	const handlePageChange = (newPage: number) => {
		setPage(newPage);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	if (error)
		return (
			<div className="py-12 text-center">
				<p className="text-error text-lg font-medium">{error}</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
					Thử lại
				</button>
			</div>
		);

	return (
		<div>
			{/* 3. GRID 5 CỘT (xl:grid-cols-5) */}
			<div className="grid grid-cols-2 gap-y-10 gap-x-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-8">
				{loading
					? [...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)
					: products.map((product) => (
							<PublicProductCard key={product._id} product={product} />
					  ))}
			</div>

			{!loading && products.length === 0 && (
				<div className="text-center py-20 text-gray-500 italic">
					Không tìm thấy sản phẩm nào.
				</div>
			)}

			{/* 4. HIỂN THỊ PHÂN TRANG */}
			{!loading && (
				<Pagination
					currentPage={page}
					totalPages={totalPages || 1} // Fallback nếu hook chưa trả về totalPages
					onPageChange={handlePageChange}
				/>
			)}
		</div>
	);
};

export default function ProductsPage() {
	return (
		<div className="min-h-screen flex flex-col bg-bg-alt">
			<ClientHeader />
			<main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
				{/* Header Section */}
				<div className="mb-12 text-center">
					<h1 className="text-4xl font-extrabold tracking-tight text-primary-dark uppercase drop-shadow-sm">
						Tất cả sản phẩm
					</h1>
					<p className="mt-3 text-lg text-text-muted font-light">
						Khám phá sản phẩm thời trang mới nhất.
					</p>
					{/* Icon trang trí */}
					<div className="mx-auto w-16 h-1.5 bg-secondary mt-5 rounded-full opacity-80"></div>
				</div>

				<div className="flex flex-col lg:flex-row gap-8">
					{/* Nếu sau này muốn thêm Sidebar Filter thì uncomment đoạn này */}
					{/* 
					<aside className="hidden lg:block w-64 flex-shrink-0">
						<div className="sticky top-24 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
							<h3 className="font-bold text-lg mb-4 text-gray-800">Bộ lọc</h3>
							<p className="text-sm text-gray-400">Tính năng đang phát triển...</p>
						</div>
					</aside> 
					*/}

					{/* Product Grid Wrapper */}
					<div className="flex-1 min-h-[500px]">
						<ProductsPageContent />
					</div>
				</div>
			</main>
			<ClientFooter />
		</div>
	);
}
