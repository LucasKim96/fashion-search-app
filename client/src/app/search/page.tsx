"use client";

import React, { useRef } from "react";
import { Upload, Search as SearchIcon, ImagePlus } from "lucide-react";
import { useImageSearch, ImageSearchCropper } from "@shared/features/search";
import {
	PublicProductCard,
	ProductCardSkeleton,
} from "@shared/features/product";
import ClientHeader from "@/components/layouts/ClientHeader"; // Header hiện tại của bạn

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
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<ClientHeader />

			<main className="flex-1 container mx-auto px-4 py-6">
				{/* KHU VỰC 1: UPLOAD & CROP */}
				<div className="bg-white p-6 rounded-xl shadow-sm mb-8">
					<div className="flex flex-col md:flex-row gap-8">
						{/* Cột Trái: Khu vực ảnh */}
						<div className="w-full md:w-1/2 lg:w-5/12">
							{!originalImageUrl ? (
								// Chưa có ảnh -> Upload UI
								<div
									onClick={triggerUpload}
									className="border-2 border-dashed border-gray-300 rounded-xl h-[400px] flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all group">
									<div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
										<ImagePlus className="w-10 h-10 text-blue-600" />
									</div>
									<p className="text-gray-600 font-medium">
										Tải ảnh lên để tìm kiếm
									</p>
									<p className="text-gray-400 text-sm mt-2">Hỗ trợ JPG, PNG</p>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										className="hidden"
										onChange={onFileChange}
									/>
								</div>
							) : (
								// Đã có ảnh -> Cropper UI
								<div className="flex flex-col gap-4">
									<div className="flex justify-between items-center mb-2">
										<h2 className="font-semibold text-gray-800">Ảnh gốc</h2>
										<button
											onClick={triggerUpload}
											className="text-sm text-blue-600 hover:underline flex items-center gap-1">
											<Upload size={14} /> Tải ảnh khác
										</button>
										{/* Input ẩn để chọn ảnh khác */}
										<input
											ref={fileInputRef}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={onFileChange}
										/>
									</div>

									{isDetecting ? (
										<div className="h-[400px] bg-gray-100 rounded-lg flex flex-col items-center justify-center animate-pulse">
											<SearchIcon className="w-10 h-10 text-gray-400 mb-2 animate-bounce" />
											<span className="text-gray-500">
												Đang phân tích ảnh...
											</span>
										</div>
									) : (
										<ImageSearchCropper
											imageUrl={originalImageUrl}
											candidates={candidates}
											selectedBox={selectedBox}
											onCropComplete={(blob) => handleSearch(blob)} // Search ngay khi crop xong
											onBoxSelect={(box) => setSelectedBox(box)} // Chọn box khác
										/>
									)}
								</div>
							)}
						</div>

						{/* Cột Phải: Kết quả tìm kiếm */}
						<div className="w-full md:w-1/2 lg:w-7/12">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
									Kết quả tìm kiếm
									{isSearching && (
										<span className="text-sm font-normal text-gray-500 animate-pulse">
											(Đang tìm...)
										</span>
									)}
								</h2>
								{searchResults.length > 0 && (
									<span className="text-sm text-gray-500">
										Tìm thấy {searchResults.length} sản phẩm
									</span>
								)}
							</div>

							{/* Grid Kết quả */}
							<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
								{isSearching ? (
									// Skeleton loading
									Array.from({ length: 6 }).map((_, i) => (
										<ProductCardSkeleton key={i} />
									))
								) : searchResults.length > 0 ? (
									searchResults.map((product) => (
										<PublicProductCard
											key={product._id}
											product={product}
											// Component PublicProductCard đã xử lý onClick vào link detail
											// Bạn không cần thêm onClick ở đây trừ khi muốn custom logic
										/>
									))
								) : originalImageUrl && !isDetecting ? (
									<div className="col-span-full h-full flex flex-col items-center justify-center text-gray-500">
										<SearchIcon className="w-12 h-12 text-gray-300 mb-3" />
										<p>Không tìm thấy sản phẩm phù hợp.</p>
										<p className="text-sm">Hãy thử điều chỉnh vùng chọn.</p>
									</div>
								) : (
									<div className="col-span-full h-full flex flex-col items-center justify-center text-gray-400">
										<p>Kết quả sẽ hiển thị tại đây</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
