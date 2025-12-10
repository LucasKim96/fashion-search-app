"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Package } from "lucide-react";

// Import hook và components
import {
	useProduct,
	ProductSearchRequest,
	ProductCard,
	Product,
	ProductToolbar,
} from "@shared/features/product";

import {
	SellerProductDetailModal,
	CreateProductModal,
} from "@/features/products";
export default function SellerProductPage() {
	// --- Hooks ---
	const { searchShopProducts, shopProductsState, fetchShopCount } =
		useProduct();

	// --- Local State ---
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedPriceRange, setSelectedPriceRange] = useState<
		ProductSearchRequest["priceRange"] | undefined
	>(undefined);
	const [isCreateClicked, setIsCreateClicked] = useState<boolean>(false);
	const [refreshKey, setRefreshKey] = useState<number>(0);
	const [stats, setStats] = useState({ total: 0, active: 0 });

	// --- STATE CHO MODAL ---
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	// (Đã xóa isDataChanged vì chuyển vào trong modal)

	// --- Handlers ---
	const triggerReload = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
	}, []);

	const handleCloseDetailModal = () => {
		setIsDetailModalOpen(false);
		// Delay nhỏ để animation đóng modal mượt mà trước khi null hóa dữ liệu
		setTimeout(() => {
			setSelectedProduct(null);
		}, 300);
	};

	const handleProductClick = (prod: Product) => {
		setSelectedProduct(prod);
		setIsDetailModalOpen(true);
	};

	// 1. Effect lấy danh sách (Search)
	useEffect(() => {
		const fetchData = async () => {
			await searchShopProducts({
				query: searchQuery,
				priceRange: selectedPriceRange,
				status: "all",
				page: 1,
				limit: 20,
			});
		};
		const timer = setTimeout(() => fetchData(), 300);
		return () => clearTimeout(timer);
	}, [searchQuery, selectedPriceRange, refreshKey, searchShopProducts]);

	// 2. Effect lấy Stats
	useEffect(() => {
		const getStats = async () => {
			const [resTotal, resActive] = await Promise.all([
				fetchShopCount(true),
				fetchShopCount(false),
			]);
			setStats({
				total: resTotal.success ? resTotal.data?.total ?? 0 : 0,
				active: resActive.success ? resActive.data?.total ?? 0 : 0,
			});
		};
		getStats();
	}, [fetchShopCount, refreshKey]);

	return (
		<div className="p-6 space-y-4 h-[1000px] flex flex-col bg-gray-50/50">
			{/* 1. Toolbar (Header, Filter, Stats) */}
			<ProductToolbar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				selectedPriceRange={selectedPriceRange}
				onPriceRangeChange={setSelectedPriceRange}
				stats={stats}
				onCreateClick={() => setIsCreateClicked(true)}
			/>

			{/* 2. Danh sách sản phẩm */}
			<div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative min-h-0">
				{shopProductsState.loading ? (
					<div className="flex items-center justify-center h-full text-gray-500">
						Đang tải dữ liệu...
					</div>
				) : (
					<div className="p-6 h-full overflow-y-auto">
						{shopProductsState.data && shopProductsState.data.length > 0 ? (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
								{shopProductsState.data.map((prod) => (
									<ProductCard
										key={prod._id}
										product={prod}
										mode="shop"
										showActions={true}
										showStatusBadge={true}
										onProductChange={triggerReload}
										onClick={() => handleProductClick(prod)}
									/>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center h-full text-gray-400">
								<Package
									size={48}
									strokeWidth={1}
									className="mb-2 opacity-50"
								/>
								<p>Không tìm thấy sản phẩm nào.</p>
							</div>
						)}
					</div>
				)}
			</div>

			{/* 3. Modal Chi tiết*/}
			<SellerProductDetailModal
				isOpen={isDetailModalOpen}
				onClose={handleCloseDetailModal}
				product={selectedProduct}
				onRefresh={triggerReload} // Truyền hàm reload xuống
			/>

			<CreateProductModal
				isOpen={isCreateClicked}
				onClose={() => setIsCreateClicked(false)}
				onRefresh={triggerReload} // Reload list sau khi tạo xong
			/>
		</div>
	);
}
