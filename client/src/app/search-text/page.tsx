"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, X, Sparkles } from "lucide-react";
import { searchByTextApi } from "@shared/features/search/search.api";
import {
	PublicProductCard,
	ProductCardSkeleton,
} from "@shared/features/product/components/PublicProductCard";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";
import clsx from "clsx";

export default function SearchPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialQuery = searchParams.get("q") || "";

	const [query, setQuery] = useState(initialQuery);
	const [results, setResults] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [isSearched, setIsSearched] = useState(false);
	const [isFocused, setIsFocused] = useState(false);

	const handleSearch = async (text: string) => {
		if (!text.trim()) return;

		setLoading(true);
		setIsSearched(true);
		router.replace(`/search-text?q=${encodeURIComponent(text)}`);

		try {
			const res = await searchByTextApi(text, 20);
			if (res.success) {
				setResults(res.data);
			} else {
				setResults([]);
			}
		} catch (error) {
			console.error("Search error:", error);
			setResults([]);
		} finally {
			setLoading(false);
		}
	};

	const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch(query);
		}
	};

	useEffect(() => {
		if (initialQuery) {
			handleSearch(initialQuery);
		}
	}, []);

	const suggestions = [
		"Áo thun trắng",
		"Váy hoa nhí",
		"Quần jean ống rộng",
		"Áo polo nam",
		"Đầm dạ hội",
	];

	return (
		<div className="min-h-screen flex flex-col bg-[#F9FAFB] text-gray-900 font-sans">
			<ClientHeader />

			<main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* --- SEARCH HEADER AREA --- */}
				<div className="max-w-3xl mx-auto mb-16 text-center flex flex-col items-center">
					{/* Title với Gradient Vàng - Đỏ (Theme của bạn) */}
					<h1 className="text-4xl md:text-5xl font-bold mb-8 flex items-center justify-center gap-3 tracking-tight">
						<Sparkles className="text-primary animate-pulse" size={40} />

						{/* Đã thêm py-2 để không bị che đuôi chữ */}
						<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-dark via-primary to-yellow-400 py-2">
							Hôm nay bạn muốn tìm gì?
						</span>
					</h1>

					{/* SEARCH BAR CONTAINER */}
					<div
						className={clsx(
							"relative w-full transition-all duration-300 ease-out rounded-full bg-white",

							isFocused ? "scale-105 shadow-xl shadow-primary/10" : "shadow-lg"
						)}>
						{/* Icon Search đổi màu theo focus */}
						<div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
							<Search
								className={clsx(
									"transition-colors duration-300",
									isFocused ? "text-primary-dark" : "text-gray-400"
								)}
								size={24}
							/>
						</div>

						<input
							type="text"
							className={clsx(
								"w-full pl-16 pr-14 py-5 rounded-full border-0 bg-transparent text-lg placeholder:text-gray-400",
								"focus:ring-2 focus:ring-primary/30 outline-none transition-all"
							)}
							placeholder="Nhập mô tả sản phẩm (VD: Áo sơ tay ngắn màu vàng...)"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={onKeyDown}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
							autoFocus
						/>

						{/* NÚT CLEAR */}
						{query && (
							<button
								onClick={() => {
									setQuery("");
									setIsSearched(false);
									setResults([]);
								}}
								className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
								title="Xóa tìm kiếm">
								<X size={20} />
							</button>
						)}
					</div>

					{/* Suggestions Chips (Hover màu Vàng) */}
					{!isSearched && (
						<div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
							{suggestions.map((tag) => (
								<button
									key={tag}
									onClick={() => {
										setQuery(tag);
										handleSearch(tag);
									}}
									className="px-5 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:border-primary hover:text-primary-dark hover:bg-primary/5 hover:shadow-sm transition-all active:scale-95">
									{tag}
								</button>
							))}
						</div>
					)}
				</div>

				{/* --- RESULTS AREA --- */}
				<div className="min-h-[400px]">
					{/* Header kết quả */}
					{isSearched && !loading && (
						<div className="flex items-center gap-2 mb-8 animate-fade-in px-2">
							{/* Thanh chỉ thị màu Vàng */}
							<div className="h-8 w-1 bg-primary rounded-full"></div>
							<h2 className="text-xl font-semibold text-gray-800">
								Kết quả cho:{" "}
								<span className="text-primary-dark">"{query}"</span>
							</h2>
							<span className="text-sm text-gray-400 ml-auto border px-3 py-1 rounded-full bg-white">
								{results.length} kết quả
							</span>
						</div>
					)}

					{/* Grid */}
					{loading ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
							{[...Array(10)].map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					) : results.length > 0 ? (
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
							{results.map((product) => (
								<PublicProductCard key={product._id} product={product} />
							))}
						</div>
					) : isSearched ? (
						<div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
							<div className="bg-gray-50 p-6 rounded-full mb-4">
								<Search className="text-gray-300" size={48} />
							</div>
							<h3 className="text-xl font-bold text-gray-800">
								Không tìm thấy sản phẩm nào
							</h3>
							<p className="text-gray-500 mt-2 max-w-md text-center">
								AI PhoCLIP chưa tìm thấy sản phẩm phù hợp với mô tả của bạn.
							</p>
							<button
								onClick={() => setQuery("")}
								className="mt-6 px-6 py-2 text-primary-dark font-bold hover:bg-primary/10 rounded-full transition-colors">
								Xóa bộ lọc
							</button>
						</div>
					) : null}
				</div>
			</main>
			<ClientFooter />
		</div>
	);
}
