"use client";

import React from "react";
import { ChevronRight, Zap, Gem, ShieldCheck } from "lucide-react";
// Import hook và các component cần thiết
import { usePublicProducts } from "@shared/features/product/usePublicProducts.hook";
import {
	PublicProductCard,
	ProductCardSkeleton,
} from "@shared/features/product/components/PublicProductCard";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";

// Component con cho Hero Section
const HeroSection = () => (
	<section className="relative w-full h-[60vh] min-h-[450px] rounded-3xl overflow-hidden text-white flex items-center shadow-2xl">
		<div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-transparent z-10"></div>
		<img
			src="/auth_background.png"
			alt="Hero Banner"
			className="absolute inset-0 w-full h-full object-cover"
		/>
		<div className="relative z-20 max-w-2xl px-8 md:px-16 animate-fade-in-up">
			<h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md">
				Phong cách của bạn, Lựa chọn của bạn.
			</h1>
			<p className="mt-4 text-lg text-gray-200 drop-shadow">
				Trải nghiệm tìm kiếm thời trang bằng hình ảnh thông minh. Tìm thấy ngay
				những gì bạn yêu thích.
			</p>
			<button className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-full text-lg hover:bg-primary-dark transition-transform hover:scale-105 shadow-lg">
				Khám phá Bộ sưu tập
			</button>
		</div>
	</section>
);

// Component con cho Features Section
const FeaturesSection = () => (
	<section className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
		<div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow">
			<Zap className="mx-auto w-12 h-12 text-primary mb-4" />
			<h3 className="text-xl font-semibold text-gray-800">Nhanh chóng</h3>
			<p className="text-gray-500 mt-2">
				Tìm kiếm sản phẩm chỉ trong vài giây với công nghệ nhận diện hình ảnh
				tiên tiến.
			</p>
		</div>
		<div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow">
			<Gem className="mx-auto w-12 h-12 text-primary mb-4" />
			<h3 className="text-xl font-semibold text-gray-800">Độc đáo</h3>
			<p className="text-gray-500 mt-2">
				Khám phá hàng ngàn sản phẩm độc đáo từ các cửa hàng trên toàn quốc.
			</p>
		</div>
		<div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow">
			<ShieldCheck className="mx-auto w-12 h-12 text-primary mb-4" />
			<h3 className="text-xl font-semibold text-gray-800">An toàn</h3>
			<p className="text-gray-500 mt-2">
				Giao dịch an toàn, đảm bảo chất lượng từ các cửa hàng đã được xác thực.
			</p>
		</div>
	</section>
);

// Component con cho Featured Products Section
const FeaturedProductsSection = () => {
	const { products, loading, error } = usePublicProducts({ limit: 8 });

	return (
		<section className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
			<div className="flex items-baseline justify-between mb-8">
				<h2 className="text-3xl font-bold text-gray-800">Sản phẩm mới nhất</h2>
				<a
					href="/products"
					className="text-sm font-semibold text-primary hover:text-primary-dark flex items-center transition-colors">
					Xem tất cả <ChevronRight size={18} className="ml-1" />
				</a>
			</div>

			{error && <p className="text-red-500 text-center">{error}</p>}

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

// Component chính của trang
export default function HomePage() {
	return (
		<div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
			<ClientHeader />

			<main className="flex-grow w-full max-w-7xl mx-auto px-4 py-10 space-y-16">
				<HeroSection />
				<FeaturesSection />
				<FeaturedProductsSection />
			</main>

			<ClientFooter />
		</div>
	);
}
