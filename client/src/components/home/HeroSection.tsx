"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import clsx from "clsx";
import Image from "next/image"; // Tối ưu ảnh

const SLIDES = [
	{
		id: 1,
		title: "Phong cách của bạn, Lựa chọn của bạn",
		desc: "Trải nghiệm tìm kiếm thời trang bằng hình ảnh thông minh.",
		gradient:
			"from-secondary-dark from-10% via-secondary via-50% to-transparent",
	},
	{
		id: 2,
		title: "Bắt kịp xu hướng thời trang mới nhất",
		desc: "Khám phá hàng ngàn bộ sưu tập độc đáo từ các thương hiệu hàng đầu.",
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

export const HeroSection = () => {
	const [currentSlide, setCurrentSlide] = useState(0);

	const nextSlide = useCallback(() => {
		setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
	}, []);

	const prevSlide = () => {
		setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
	};

	useEffect(() => {
		const timer = setInterval(nextSlide, 8000); // 8s
		return () => clearInterval(timer);
	}, [nextSlide]);

	return (
		<section className="relative w-full h-[60vh] min-h-[450px] rounded-3xl overflow-hidden shadow-2xl group border border-gray-200">
			{SLIDES.map((slide, index) => (
				<div
					key={slide.id}
					className={clsx(
						"absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out flex items-center",
						index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
					)}>
					{/* Dùng Next/Image để tối ưu SEO và tốc độ load */}
					<Image
						src="/auth_background1.jpg"
						alt="Hero Banner"
						fill
						priority={index === 0} // Ưu tiên load slide đầu tiên
						className="object-cover"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
					/>

					<div
						className={clsx(
							"absolute inset-0 bg-gradient-to-r z-10 opacity-90 mix-blend-multiply",
							slide.gradient
						)}
					/>

					<div className="relative z-20 max-w-3xl px-8 md:px-16 animate-fade-in-up">
						<h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg text-white leading-tight">
							{slide.title}
						</h1>
						<div className="w-24 h-1 bg-primary mt-4 mb-4 rounded-full"></div>
						<p className="text-lg md:text-xl text-gray-100 drop-shadow-md font-light max-w-2xl">
							{slide.desc}
						</p>
					</div>
				</div>
			))}

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

			<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
				{SLIDES.map((_, index) => (
					<button
						key={index}
						onClick={() => setCurrentSlide(index)}
						className={clsx(
							"h-2.5 rounded-full transition-all duration-300 shadow-sm border border-white/30",
							index === currentSlide
								? "w-10 bg-primary"
								: "w-2.5 bg-white/40 hover:bg-white/80"
						)}
						aria-label={`Go to slide ${index + 1}`}
					/>
				))}
			</div>
		</section>
	);
};
