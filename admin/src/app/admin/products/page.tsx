"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Package } from "lucide-react";
import {
	useProduct,
	ProductSearchRequest,
	ProductCard,
	Product,
} from "@shared/features/product";
import { SellerProductDetailModal } from "@/features/products";
import { ProductToolbar } from "@shared/features/product";
export default function AdminProductPage() {
	// --- Hooks ---
	// Lấy thêm fetchAdminCount và adminCountState
	const {
		searchAdminProducts,
		adminProductsState,
		fetchAdminCount,
		adminCountState,
	} = useProduct();

	// --- Local State ---
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedPriceRange, setSelectedPriceRange] = useState<
		ProductSearchRequest["priceRange"] | undefined
	>(undefined);
	const [isCreateClicked, setIsCreateClicked] = useState<boolean>(false);
	const [refreshKey, setRefreshKey] = useState<number>(0);
	const [stats, setStats] = useState({
		total: 0,
		active: 0,
	});

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

	// 1. Effect lấy danh sách sản phẩm (Search)
	useEffect(() => {
		const fetchData = async () => {
			await searchAdminProducts({
				query: searchQuery,
				priceRange: selectedPriceRange,
				status: "all",
				page: 1,
				limit: 20,
			});
		};

		const timer = setTimeout(() => {
			fetchData();
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, selectedPriceRange, refreshKey, searchAdminProducts]);

	// 2. Effect lấy tổng số lượng sản phẩm (chạy mỗi khi reload)
	useEffect(() => {
		const getStats = async () => {
			// Gọi song song 2 request để tiết kiệm thời gian
			const [resTotal, resActive] = await Promise.all([
				fetchAdminCount(true), // includeInactive = true (Lấy tổng cả ẩn)
				fetchAdminCount(false), // includeInactive = false (Chỉ lấy đang bán)
			]);

			setStats({
				total: resTotal.success ? resTotal.data?.total ?? 0 : 0,
				active: resActive.success ? resActive.data?.total ?? 0 : 0,
			});
		};
		getStats();
	}, [fetchAdminCount, refreshKey]);

	return (
		<div className="p-6 space-y-4 h-[1000px] flex flex-col bg-gray-50/50">
			{/* 1. Toolbar (Header, Filter, Stats) */}
			<ProductToolbar
				isAdmin={true}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				selectedPriceRange={selectedPriceRange}
				onPriceRangeChange={setSelectedPriceRange}
				stats={stats}
			/>
			{/* 4. Content List */}
			<div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative min-h-0">
				{adminProductsState.loading ? (
					<div className="flex items-center justify-center h-full text-gray-500">
						Đang tải dữ liệu...
					</div>
				) : (
					<div className="p-6 h-full overflow-y-auto">
						{adminProductsState.data && adminProductsState.data.length > 0 ? (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
								{adminProductsState.data.map((prod) => (
									<ProductCard
										key={prod._id}
										product={prod}
										mode="admin" // Chế độ Admin
										showActions={true} // Hiển thị nút xóa/ẩn
										showStatusBadge={true} // Hiển thị badge nếu ẩn
										onProductChange={triggerReload} // Quan trọng: Gọi reload khi có thay đổi
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
		</div>
	);
}

// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import clsx from "clsx";
// import {
// 	Plus,
// 	Grid,
// 	Tag,
// 	Coins,
// 	CreditCard,
// 	Banknote,
// 	Gem,
// 	Filter,
// 	Package,
// 	CheckCircle,
// } from "lucide-react";

// // Import hook và components
// import {
// 	useProduct,
// 	ProductSearchRequest,
// 	ProductCard,
// } from "@shared/features/product";
// import { SearchHeader, GradientButton } from "@shared/core";

// // Danh sách bộ lọc giá (Giữ nguyên)
// const priceFilters = [
// 	{
// 		label: "Tất cả mức giá",
// 		value: undefined,
// 		color: "from-gray-400 via-gray-350 to-gray-600",
// 		icon: <Grid size={16} />,
// 	},
// 	{
// 		label: "Dưới 100k",
// 		value: "<100",
// 		color: "from-blue-400 via-blue-500 to-blue-600",
// 		icon: <Coins size={16} />,
// 	},
// 	{
// 		label: "100k - 300k",
// 		value: "100-300",
// 		color: "from-cyan-400 via-cyan-500 to-cyan-600",
// 		icon: <Banknote size={16} />,
// 	},
// 	{
// 		label: "300k - 500k",
// 		value: "300-500",
// 		color: "from-teal-400 via-teal-500 to-teal-600",
// 		icon: <CreditCard size={16} />,
// 	},
// 	{
// 		label: "500k - 1 triệu",
// 		value: "500-1000",
// 		color: "from-indigo-400 via-indigo-500 to-indigo-600",
// 		icon: <Tag size={16} />,
// 	},
// 	{
// 		label: "Trên 1 triệu",
// 		value: "1000<",
// 		color: "from-purple-400 via-purple-500 to-purple-600",
// 		icon: <Gem size={16} />,
// 	},
// ];

// export default function SellerProductPage() {
// 	// --- Hooks ---
// 	// Lấy thêm fetchAdminCount và adminCountState
// 	const {
// 		searchAdminProducts,
// 		adminProductsState,
// 		fetchAdminCount,
// 		adminCountState,
// 	} = useProduct();

// 	// --- Local State ---
// 	const [searchQuery, setSearchQuery] = useState<string>("");
// 	const [selectedPriceRange, setSelectedPriceRange] = useState<
// 		ProductSearchRequest["priceRange"] | undefined
// 	>(undefined);
// 	const [isCreateClicked, setIsCreateClicked] = useState<boolean>(false);
// 	const [refreshKey, setRefreshKey] = useState<number>(0);
// 	const [stats, setStats] = useState({
// 		total: 0,
// 		active: 0,
// 	});

// 	// --- Handlers ---
// 	const triggerReload = useCallback(() => {
// 		setRefreshKey((prev) => prev + 1);
// 	}, []);

// 	// 1. Effect lấy danh sách sản phẩm (Search)
// 	useEffect(() => {
// 		const fetchData = async () => {
// 			await searchAdminProducts({
// 				query: searchQuery,
// 				priceRange: selectedPriceRange,
// 				status: "all",
// 				page: 1,
// 				limit: 20,
// 			});
// 		};

// 		const timer = setTimeout(() => {
// 			fetchData();
// 		}, 300);

// 		return () => clearTimeout(timer);
// 	}, [searchQuery, selectedPriceRange, refreshKey, searchAdminProducts]);

// 	// 2. Effect lấy tổng số lượng sản phẩm (chạy mỗi khi reload)
// 	useEffect(() => {
// 		const getStats = async () => {
// 			// Gọi song song 2 request để tiết kiệm thời gian
// 			const [resTotal, resActive] = await Promise.all([
// 				fetchAdminCount(true), // includeInactive = true (Lấy tổng cả ẩn)
// 				fetchAdminCount(false), // includeInactive = false (Chỉ lấy đang bán)
// 			]);

// 			setStats({
// 				total: resTotal.success ? resTotal.data?.total ?? 0 : 0,
// 				active: resActive.success ? resActive.data?.total ?? 0 : 0,
// 			});
// 		};
// 		getStats();
// 	}, [fetchAdminCount, refreshKey]);

// 	return (
// 		<div className="p-6 space-y-4 h-screen flex flex-col bg-gray-50/50">
// 			{/* 1. Header với Search */}
// 			<SearchHeader
// 				title="QUẢN LÝ SẢN PHẨM"
// 				searchPlaceholder="Tìm kiếm theo tên sản phẩm..."
// 				searchValue={searchQuery}
// 				onSearchChange={setSearchQuery}
// 			/>

// 			{/* 2. Bộ lọc + Nút tạo */}
// 			<div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
// 				{/* Filter */}
// 				<div className="flex flex-col gap-2 flex-1">
// 					<div className="flex items-center gap-2 text-gray-600">
// 						<Filter size={18} />
// 						<span className="text-sm font-semibold">Lọc theo khoảng giá:</span>
// 					</div>

// 					<div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-2xl shadow-inner border border-gray-200">
// 						{priceFilters.map((item) => (
// 							<button
// 								key={item.label}
// 								onClick={() =>
// 									setSelectedPriceRange(
// 										item.value as ProductSearchRequest["priceRange"]
// 									)
// 								}
// 								className={clsx(
// 									"relative flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm",
// 									selectedPriceRange === item.value
// 										? `bg-gradient-to-r ${item.color} text-white shadow-md scale-105`
// 										: "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
// 								)}>
// 								{item.icon}
// 								{item.label}
// 							</button>
// 						))}
// 					</div>
// 				</div>

// 				{/* Nút tạo */}
// 				<div className="flex-shrink-0 pb-1">
// 					<GradientButton
// 						label="Thêm sản phẩm mới"
// 						icon={Plus}
// 						gradient="bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600"
// 						hoverGradient="hover:from-green-600 hover:to-emerald-700"
// 						onClick={() => setIsCreateClicked(true)}
// 						className="shadow-lg shadow-green-500/30 h-[46px]"
// 					/>
// 				</div>
// 			</div>
// 			{/* ---Thống kê số lượng --- */}
// 			<div className="flex flex-wrap gap-4 justify-end">
// 				{/* Card 1: Tổng tất cả sản phẩm */}
// 				<div className="flex items-center gap-3 bg-white py-3 px-5 rounded-xl border border-gray-200 shadow-sm min-w-[200px]">
// 					<div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
// 						<Package size={24} strokeWidth={2} />
// 					</div>
// 					<div className="flex flex-col">
// 						<span className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">
// 							Tổng số lượng
// 						</span>
// 						<div className="flex items-baseline gap-1">
// 							<span className="text-2xl font-extrabold text-gray-800 leading-none">
// 								{stats.total}
// 							</span>
// 							<span className="text-xs font-medium text-gray-400">
// 								sản phẩm
// 							</span>
// 						</div>
// 					</div>
// 				</div>

// 				{/* Card 2: Sản phẩm đang bán (Khả dụng) */}
// 				<div className="flex items-center gap-3 bg-white py-3 px-5 rounded-xl border border-gray-200 shadow-sm min-w-[200px]">
// 					<div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
// 						<CheckCircle size={24} strokeWidth={2} />
// 					</div>
// 					<div className="flex flex-col">
// 						<span className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">
// 							Đang kinh doanh
// 						</span>
// 						<div className="flex items-baseline gap-1">
// 							<span className="text-2xl font-extrabold text-emerald-600 leading-none">
// 								{stats.active}
// 							</span>
// 							<span className="text-xs font-medium text-gray-400">
// 								khả dụng
// 							</span>
// 						</div>
// 					</div>
// 				</div>
// 			</div>

// 			{/* 4. Content List */}
// 			<div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative min-h-0">
// 				{adminProductsState.loading ? (
// 					<div className="flex items-center justify-center h-full text-gray-500">
// 						Đang tải dữ liệu...
// 					</div>
// 				) : (
// 					<div className="p-6 h-full overflow-y-auto">
// 						{adminProductsState.data && adminProductsState.data.length > 0 ? (
// 							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
// 								{adminProductsState.data.map((prod) => (
// 									<ProductCard
// 										key={prod._id}
// 										product={prod}
// 										mode="admin" // Chế độ Admin
// 										showActions={true} // Hiển thị nút xóa/ẩn
// 										showStatusBadge={true} // Hiển thị badge nếu ẩn
// 										onProductChange={triggerReload} // Quan trọng: Gọi reload khi có thay đổi
// 										onClick={() => {
// 											// Logic mở modal edit hoặc chuyển trang chi tiết
// 											console.log("Click product:", prod._id);
// 										}}
// 									/>
// 								))}
// 							</div>
// 						) : (
// 							<div className="flex flex-col items-center justify-center h-full text-gray-400">
// 								<Package
// 									size={48}
// 									strokeWidth={1}
// 									className="mb-2 opacity-50"
// 								/>
// 								<p>Không tìm thấy sản phẩm nào.</p>
// 							</div>
// 						)}
// 					</div>
// 				)}
// 			</div>
// 		</div>
// 	);
// }
