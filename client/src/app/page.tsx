"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronLeft, Zap, Gem, ShieldCheck } from "lucide-react";
import clsx from "clsx";
// Import hook và các component cần thiết
import { usePublicProducts } from "@shared/features/product/usePublicProducts.hook";
import {
	PublicProductCard,
	ProductCardSkeleton,
} from "@shared/features/product/components/PublicProductCard";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";

// --- DỮ LIỆU SLIDER ---
const SLIDES = [
	{
		id: 1,
		title: "Phong cách của bạn, Lựa chọn của bạn",
		desc: "Trải nghiệm tìm kiếm thời trang bằng hình ảnh thông minh. Tìm thấy ngay những gì bạn yêu thích.",
		gradient:
			"from-secondary-dark from-10% via-secondary via-50% to-transparent",
	},
	{
		id: 2,
		title: "Bắt kịp xu hướng thời trang mới nhất",
		desc: "Khám phá hàng ngàn bộ sưu tập độc đáo từ các thương hiệu hàng đầu mỗi ngày.",
		gradient:
			"from-gray-900 from-10% via-secondary-dark via-50% to-transparent",
	},
	{
		id: 3,
		title: "Tìm kiếm thông minh, Mua sắm dễ dàng",
		desc: "Công nghệ AI giúp bạn tìm chính xác món đồ ưng ý chỉ trong tích tắc.",
		gradient:
			"from-secondary-dark from-10% via-primary-dark via-55% to-transparent",
	},
];

// --- HERO SECTION (SLIDER) ---
const HeroSection = () => {
	const [currentSlide, setCurrentSlide] = useState(0);

	// Hàm chuyển slide tiếp theo
	const nextSlide = useCallback(() => {
		setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
	}, []);

	// Hàm quay lại slide trước
	const prevSlide = () => {
		setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
	};

	// Tự động chuyển slide sau 8 giây
	useEffect(() => {
		const timer = setInterval(nextSlide, 15000);
		return () => clearInterval(timer);
	}, [nextSlide]);

	return (
		<section className="relative w-full h-[60vh] min-h-[450px] rounded-3xl overflow-hidden shadow-2xl group border border-gray-200">
			{/* SLIDES */}
			{SLIDES.map((slide, index) => (
				<div
					key={slide.id}
					className={clsx(
						"absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out flex items-center",
						index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
					)}>
					{/* Background Image */}
					<img
						src="/auth_background1.jpg"
						alt="Hero Banner"
						className="absolute inset-0 w-full h-full object-cover"
					/>

					{/* Overlay Gradient (Sử dụng màu Đỏ thẫm làm chủ đạo) */}
					<div
						className={clsx(
							"absolute inset-0 bg-gradient-to-r z-10 opacity-90 mix-blend-multiply",
							slide.gradient
						)}
					/>

					{/* Text Content */}
					<div className="relative z-20 max-w-3xl px-8 md:px-16 animate-fade-in-up">
						<h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg text-white leading-tight">
							{slide.title}
						</h1>
						{/* Line trang trí màu Vàng */}
						<div className="w-24 h-1 bg-primary mt-4 mb-4 rounded-full"></div>
						<p className="text-lg md:text-xl text-gray-100 drop-shadow-md font-light max-w-2xl">
							{slide.desc}
						</p>
					</div>
				</div>
			))}

			{/* --- NAVIGATION ARROWS --- */}
			{/* Nút bấm dùng màu Vàng (Primary) khi hover để nổi bật trên nền Đỏ */}
			<button
				onClick={prevSlide}
				className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-primary hover:text-black hover:border-primary transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 duration-300 shadow-lg">
				<ChevronLeft size={28} strokeWidth={2.5} />
			</button>

			<button
				onClick={nextSlide}
				className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-primary hover:text-black hover:border-primary transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300 shadow-lg">
				<ChevronRight size={28} strokeWidth={2.5} />
			</button>

			{/* --- PAGINATION DOTS --- */}
			<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
				{SLIDES.map((_, index) => (
					<button
						key={index}
						onClick={() => setCurrentSlide(index)}
						className={clsx(
							"h-2.5 rounded-full transition-all duration-300 shadow-sm border border-white/30",
							index === currentSlide
								? "w-10 bg-primary" // Active: Màu Vàng
								: "w-2.5 bg-white/40 hover:bg-white/80" // Inactive: Trắng mờ
						)}
						aria-label={`Go to slide ${index + 1}`}
					/>
				))}
			</div>
		</section>
	);
};

// Component con cho Features Section
const FeaturesSection = () => (
	<section className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
		{/* Card 1 */}
		<div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/30">
			<div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 mb-6">
				{/* Icon màu Vàng đậm, hover chuyển sang trắng hoặc đen tùy ý (ở đây giữ nguyên logic icon nổi) */}
				<Zap className="w-8 h-8 text-primary-dark group-hover:text-black transition-colors" />
			</div>
			<h3 className="text-xl font-bold text-secondary-dark group-hover:text-secondary transition-colors">
				Nhanh chóng
			</h3>
			<p className="text-text-muted mt-3 leading-relaxed">
				Tìm kiếm sản phẩm chỉ trong vài giây với công nghệ nhận diện hình ảnh
				tiên tiến.
			</p>
		</div>

		{/* Card 2 */}
		<div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/30">
			<div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 mb-6">
				<Gem className="w-8 h-8 text-primary-dark group-hover:text-black transition-colors" />
			</div>
			<h3 className="text-xl font-bold text-secondary-dark group-hover:text-secondary transition-colors">
				Độc đáo
			</h3>
			<p className="text-text-muted mt-3 leading-relaxed">
				Khám phá hàng ngàn sản phẩm độc đáo từ các cửa hàng trên toàn quốc.
			</p>
		</div>

		{/* Card 3 */}
		<div className="group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/30">
			<div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 mb-6">
				<ShieldCheck className="w-8 h-8 text-primary-dark group-hover:text-black transition-colors" />
			</div>
			<h3 className="text-xl font-bold text-secondary-dark group-hover:text-secondary transition-colors">
				An toàn
			</h3>
			<p className="text-text-muted mt-3 leading-relaxed">
				Giao dịch an toàn, đảm bảo chất lượng từ các cửa hàng đã được xác thực.
			</p>
		</div>
	</section>
);

// Component con cho Featured Products Section
const FeaturedProductsSection = () => {
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

// Component chính của trang
export default function HomePage() {
	return (
		// Nền trang dùng bg-alt (xám rất nhạt) để các khối trắng nổi bật
		<div className="min-h-screen flex flex-col bg-bg-alt text-text">
			<ClientHeader />

			<main className="flex-grow w-full max-w-7xl mx-auto px-4 py-12 space-y-20">
				<HeroSection />
				<FeaturesSection />
				<FeaturedProductsSection />
			</main>

			<ClientFooter />
		</div>
	);
}
