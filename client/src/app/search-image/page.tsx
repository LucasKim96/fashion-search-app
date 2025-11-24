"use client";

import React, { useRef } from "react";
import {
	Upload,
	Search as SearchIcon,
	ImagePlus,
	Sparkles,
	Camera,
	ImageIcon,
	Loader2,
	PackageSearch,
	ShoppingBag,
} from "lucide-react";
import { useImageSearch, ImageSearchCropper } from "@shared/features/search";
import {
	PublicProductCard,
	ProductCardSkeleton,
} from "@shared/features/product";
import ClientHeader from "@/components/layouts/ClientHeader"; // Header hiện tại của bạn
import clsx from "clsx";

export default function SearchPage() {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const {
		originalImageUrl,
		candidates,
		selectedBox,
		searchResults,
		isDetecting,
		isSearching,
		handleUpload,
		handleSearch,
		setSelectedBox,
		resetSearch,
	} = useImageSearch();

	// Xử lý chọn file từ máy
	const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			handleUpload(e.target.files[0]);
		}
	};

	// Trigger input file
	const triggerUpload = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col font-sans">
			<ClientHeader />

			<main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
				{/* --- PHẦN 1: KHU VỰC TÌM KIẾM (UPLOAD & CROP) --- */}
				<section className="flex flex-col items-center justify-center mb-12">
					<div className="w-full max-w-4xl transition-all duration-500 ease-in-out">
						{/* HEADER TEXT */}
						{/* Container chính: Flex row để xếp Icon và Text nằm ngang */}
						<div className="flex items-center justify-center gap-4 mb-8 px-4">
							{/* 1. PHẦN LOGO (Bên trái) */}
							<div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white shrink-0">
								<Sparkles
									size={28}
									fill="currentColor"
									className="opacity-90"
								/>
							</div>

							{/* 2. PHẦN TEXT (Bên phải - Xếp dọc) */}
							<div className="text-left">
								<h1 className="text-2xl md:text-3xl font-bold text-indigo-800 leading-tight">
									Tìm kiếm thông minh bằng AI
								</h1>
								<p className="text-slate-500 text-sm md:text-base mt-1 font-medium">
									Tải ảnh lên và chọn vùng để tìm sản phẩm tương tự
								</p>
							</div>
						</div>

						{/* SEARCH CONTAINER */}
						<div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
							{!originalImageUrl ? (
								// --- TRẠNG THÁI 1: CHƯA CÓ ẢNH (UPLOAD UI) ---
								<div
									onClick={triggerUpload}
									className="group relative h-[330px] bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer m-5 rounded-xl">
									<div className="p-5 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-transform duration-300">
										<ImagePlus className="w-10 h-10 text-indigo-500" />
									</div>
									<h3 className="text-lg font-semibold text-slate-700 group-hover:text-indigo-600">
										Tải ảnh lên để tìm kiếm
									</h3>
									<p className="text-slate-400 text-sm mt-1">
										Hỗ trợ định dạng JPG, PNG
									</p>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										className="hidden"
										onChange={onFileChange}
									/>
								</div>
							) : (
								// --- TRẠNG THÁI 2: ĐÃ CÓ ẢNH (CROPPER UI) ---
								<div className="p-6">
									<div className="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-slate-100 gap-4">
										{/* TRÁI: TIÊU ĐỀ & ICON */}
										<div className="flex items-center gap-3">
											{/* Icon Box trang trí */}
											<div className="p-2.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 text-indigo-600 shadow-sm">
												<ImageIcon size={20} strokeWidth={2.5} />
											</div>

											<div className="flex flex-col">
												<span className="font-bold text-slate-800 text-base leading-tight">
													Ảnh gốc
												</span>
												<span className="text-sm text-slate-500 font-medium">
													Vùng đang chọn
												</span>
											</div>
										</div>

										{/* PHẢI: NÚT UPLOAD (STYLE MỚI) */}
										<div className="flex gap-3">
											<button
												onClick={triggerUpload}
												className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 ease-out"
												title="Tải ảnh khác lên">
												{/* Icon Camera */}
												<Camera size={18} strokeWidth={2.5} />

												{/* Text Button */}
												<span className="text-sm font-semibold tracking-wide">
													Chọn ảnh khác
												</span>

												{/* Hiệu ứng bóng lóa nhẹ khi hover (Optional) */}
												<div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
											</button>

											{/* Input ẩn giữ nguyên */}
											<input
												ref={fileInputRef}
												type="file"
												accept="image/*"
												className="hidden"
												onChange={onFileChange}
											/>
										</div>
									</div>

									<div className="flex justify-center rounded-xl overflow-visible">
										{isDetecting ? (
											<div className="h-[400px] w-full flex flex-col items-center justify-center">
												<div className="relative">
													<div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
													<div className="absolute inset-0 flex items-center justify-center">
														<Sparkles
															size={20}
															className="text-indigo-600 animate-pulse"
														/>
													</div>
												</div>
												<p className="text-slate-500 font-medium mt-4 animate-pulse">
													AI đang phân tích đối tượng...
												</p>
											</div>
										) : (
											<div className="w-full">
												<ImageSearchCropper
													imageUrl={originalImageUrl}
													candidates={candidates}
													selectedBox={selectedBox}
													onCropComplete={(blob) => handleSearch(blob)}
													onBoxSelect={(box) => setSelectedBox(box)}
												/>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</section>

				{/* --- PHẦN 2: KẾT QUẢ TÌM KIẾM --- */}
				{originalImageUrl && !isDetecting && (
					<section className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
						{/* CONTAINER CHÍNH: Nền trắng, đổ bóng, bo góc */}
						<div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden">
							{/* Hiệu ứng nền trang trí (Blob) mờ phía góc */}
							<div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

							{/* HEADER KẾT QUẢ */}
							<div className="relative flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-50 pb-6">
								{/* Trái: Tiêu đề & Icon */}
								<div className="flex items-center gap-4">
									{/* Icon Box với Gradient MỚI: Rose/Pink (Tạo cảm giác Fashion/Sản phẩm) */}
									<div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg shadow-pink-500/30 text-white shrink-0">
										<ShoppingBag
											size={24}
											strokeWidth={2.5} // Nét dày hơn chút cho khỏe khoắn
											className="opacity-95"
										/>
									</div>

									<div>
										<h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">
											Kết quả phù hợp
										</h2>
										<p className="text-slate-500 text-sm mt-1 font-medium">
											Danh sách sản phẩm tương đồng tìm thấy
										</p>
									</div>
								</div>

								{/* Phải: Trạng thái / Số lượng */}
								<div
									className={clsx(
										"flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all border shadow-sm",
										isSearching
											? "bg-amber-50 text-amber-600 border-amber-100"
											: "bg-indigo-50 text-indigo-600 border-indigo-100"
									)}>
									{isSearching ? (
										<>
											<Loader2 size={16} className="animate-spin" />
											<span>Đang phân tích...</span>
										</>
									) : (
										<>
											<div className="relative flex h-2.5 w-2.5">
												<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
												<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
											</div>
											<span>
												Tìm thấy{" "}
												<span className="text-lg">{searchResults.length}</span>{" "}
												sản phẩm
											</span>
										</>
									)}
								</div>
							</div>

							{/* GRID LAYOUT */}
							<div
								className={clsx(
									"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10",
									searchResults.length < 4 ? "justify-start" : ""
								)}>
								{isSearching ? (
									// Skeleton Loading
									Array.from({ length: 8 }).map((_, i) => (
										<ProductCardSkeleton key={i} />
									))
								) : searchResults.length > 0 ? (
									// Danh sách kết quả
									searchResults.map((product) => (
										<div
											key={product._id}
											className="h-full transform hover:-translate-y-1 transition-transform duration-300">
											<PublicProductCard product={product} />
										</div>
									))
								) : (
									// Empty State (Được làm đẹp lại)
									<div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
										<div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
											<PackageSearch className="w-10 h-10 text-slate-300" />
										</div>
										<h3 className="text-xl font-bold text-slate-800">
											Không tìm thấy kết quả nào
										</h3>
										<p className="text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
											Có vẻ như AI chưa nhận diện được sản phẩm này trong kho dữ
											liệu.
											<br />
											Hãy thử chọn vùng crop khác hoặc tải ảnh rõ nét hơn.
										</p>
									</div>
								)}
							</div>
						</div>
					</section>
				)}
			</main>
		</div>
	);
}
