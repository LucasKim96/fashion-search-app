"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	Calendar,
	Package,
	Store,
	Loader2,
	CheckCircle2,
	Phone,
	MessageCircle,
	UserPlus,
} from "lucide-react";
import clsx from "clsx";

// Imports
import { getShopByIdApi } from "@shared/features/shop/shop.api";
import {
	ShopResponse,
	ShopAccountInfo,
} from "@shared/features/shop/shop.types";
import { usePublicProducts } from "@shared/features/product/usePublicProducts.hook";
import {
	PublicProductCard,
	ProductCardSkeleton,
} from "@shared/features/product/components/PublicProductCard";
import { ImageWithFallback } from "@shared/core/components/ui/ImageWithFallback";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";

export default function ShopDetailPage() {
	const { shopId } = useParams() as { shopId: string };
	const router = useRouter();

	const [shop, setShop] = useState<ShopResponse | null>(null);
	const [loadingShop, setLoadingShop] = useState(true);
	const [shopError, setShopError] = useState<string | null>(null);
	const [page, setPage] = useState(1);

	useEffect(() => {
		if (!shopId) return;
		const fetchShopInfo = async () => {
			setLoadingShop(true);
			try {
				const res = await getShopByIdApi(shopId);
				if (res.success && res.data) {
					setShop(res.data);
				} else {
					setShopError("Không tìm thấy cửa hàng.");
				}
			} catch (error: any) {
				setShopError(error.message || "Lỗi kết nối.");
			} finally {
				setLoadingShop(false);
			}
		};
		fetchShopInfo();
	}, [shopId]);

	const {
		products,
		loading: loadingProducts,
		totalPages,
	} = usePublicProducts({
		page,
		limit: 12,
		shopId: shopId,
	});

	const handlePageChange = (newPage: number) => {
		setPage(newPage);
		document
			.getElementById("shop-products-grid")
			?.scrollIntoView({ behavior: "smooth" });
	};

	if (loadingShop) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-bg-alt">
				<Loader2 className="animate-spin text-primary" size={40} />
			</div>
		);
	}

	if (shopError || !shop) {
		return (
			<div className="min-h-screen flex flex-col bg-bg-alt">
				<ClientHeader />
				<div className="flex-grow flex flex-col items-center justify-center text-center px-4">
					<Store size={64} className="text-gray-300 mb-4" />
					<h2 className="text-xl font-bold text-gray-700 mb-2">
						Shop không tồn tại
					</h2>
					<button
						onClick={() => router.push("/products")}
						className="px-6 py-2 bg-primary text-white font-bold rounded-full">
						Tiếp tục mua sắm
					</button>
				</div>
				<ClientFooter />
			</div>
		);
	}

	const ownerInfo =
		typeof shop.accountId === "object"
			? (shop.accountId as ShopAccountInfo)
			: null;

	return (
		<div className="min-h-screen flex flex-col bg-gray-50 text-text">
			<ClientHeader />

			<main className="flex-grow">
				{/* --- SHOP HEADER --- */}
				<div className="bg-white shadow-sm pb-6">
					<div className="max-w-7xl mx-auto">
						{/* 1. Cover Image (Full width) */}
						<div className="h-48 md:h-80 w-full bg-gray-200 relative">
							<ImageWithFallback
								src={shop.coverUrl || ""}
								alt="Cover"
								className="w-full h-full object-cover"
								fallbackClassName="bg-gradient-to-r from-gray-800 to-gray-900"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
						</div>

						{/* 2. Info Container */}
						<div className="px-4 sm:px-6 lg:px-8 relative -mt-16 md:-mt-20 z-10">
							<div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
								{/* Logo */}
								<div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex-shrink-0 -mt-12 md:-mt-16 relative z-20">
									<ImageWithFallback
										src={shop.logoUrl || ""}
										alt={shop.shopName}
										className="w-full h-full object-cover"
									/>
								</div>

								{/* Info Text */}
								<div className="flex-1 min-w-0 pt-2 md:pt-0">
									<h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-2 mb-2">
										{shop.shopName}
										<CheckCircle2
											size={24}
											className="text-blue-500 fill-white"
										/>
									</h1>

									<div className="flex flex-wrap gap-4 text-sm text-gray-600">
										<div className="flex items-center gap-1.5">
											<Calendar size={16} className="text-gray-400" />
											<span>
												Tham gia:{" "}
												{new Date(shop.createdAt).toLocaleDateString("vi-VN")}
											</span>
										</div>
										{ownerInfo?.phoneNumber && (
											<div className="flex items-center gap-1.5">
												<Phone size={16} className="text-gray-400" />
												<span>{ownerInfo.phoneNumber}</span>
											</div>
										)}
									</div>
								</div>

								{/* Action Buttons (Right aligned on Desktop) */}
								<div className="flex gap-3 w-full md:w-auto pt-2 md:pt-0">
									<button className="flex-1 md:flex-none px-6 py-2.5 bg-primary hover:bg-primary-light text-black font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95">
										<UserPlus size={18} /> Theo dõi
									</button>
									<button className="flex-1 md:flex-none px-6 py-2.5 border border-gray-300 hover:border-primary hover:text-primary bg-white text-gray-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95">
										<MessageCircle size={18} /> Chat ngay
									</button>
								</div>
							</div>

							{/* Description (Separate Block) */}
							{shop.description && (
								<div className="mt-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
									<h3 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
										<Store size={16} className="text-primary" /> Giới thiệu Shop
									</h3>
									<p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
										{shop.description}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* --- SECTION 2: PRODUCT LIST --- */}
				<div
					id="shop-products-grid"
					className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
						<h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
							<Package className="text-primary" />
							Danh sách sản phẩm
						</h2>
						{/* Optional: Sort Filter here */}
					</div>

					<div className="grid grid-cols-2 gap-y-8 gap-x-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{loadingProducts ? (
							[...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)
						) : products.length > 0 ? (
							products.map((product) => (
								<PublicProductCard key={product._id} product={product} />
							))
						) : (
							<div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
								<Package size={64} className="mb-4 opacity-20" />
								<p className="text-lg">Shop chưa đăng bán sản phẩm nào.</p>
							</div>
						)}
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex justify-center gap-2 mt-16">
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
								<button
									key={p}
									onClick={() => handlePageChange(p)}
									className={clsx(
										"w-10 h-10 rounded-lg font-bold text-sm transition-all border shadow-sm",
										page === p
											? "bg-primary text-black border-primary scale-110"
											: "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
									)}>
									{p}
								</button>
							))}
						</div>
					)}
				</div>
			</main>

			<ClientFooter />
		</div>
	);
}
