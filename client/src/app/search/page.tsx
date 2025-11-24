// "use client";
// import React, { useEffect } from "react";
// import { useImageSearch, ImageSearchCropper } from "@shared/features/search";
// import { PublicProductCard } from "@shared/features/product"; // Component hiển thị list sản phẩm
// import { UploadCloud, RefreshCcw, Search } from "lucide-react";
// import clsx from "clsx";

// export default function ImageSearchPage() {
// 	const {
// 		originalImageUrl,
// 		candidates,
// 		selectedBox,
// 		searchResults,
// 		isDetecting,
// 		isSearching,
// 		handleUpload,
// 		handleSearch,
// 		setSelectedBox,
// 		resetSearch,
// 	} = useImageSearch();

// 	// Effect: Khi selectedBox thay đổi, Cropper sẽ tự crop và gọi onCropComplete
// 	// -> trigger handleSearch.

// 	return (
// 		<div className="container mx-auto py-8 px-4 min-h-screen">
// 			<h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
// 				<Search className="text-indigo-600" />
// 				Tìm kiếm bằng hình ảnh
// 			</h1>

// 			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
// 				{/* --- CỘT TRÁI: UPLOAD & CROP --- */}
// 				<div className="lg:col-span-4 space-y-6">
// 					{/* 1. KHU VỰC UPLOAD */}
// 					{!originalImageUrl ? (
// 						<label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
// 							<div className="flex flex-col items-center justify-center pt-5 pb-6">
// 								<UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
// 								<p className="mb-2 text-sm text-gray-500 font-semibold">
// 									Nhấn để tải ảnh lên
// 								</p>
// 								<p className="text-xs text-gray-400">JPG, PNG (Max 5MB)</p>
// 							</div>
// 							<input
// 								type="file"
// 								className="hidden"
// 								accept="image/*"
// 								onChange={(e) =>
// 									e.target.files?.[0] && handleUpload(e.target.files[0])
// 								}
// 							/>
// 						</label>
// 					) : (
// 						<div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
// 							{/* CROPPER */}
// 							<ImageSearchCropper
// 								imageUrl={originalImageUrl}
// 								candidates={candidates}
// 								selectedBox={selectedBox}
// 								onCropComplete={handleSearch} // Tự động search khi thả tay
// 								onBoxSelect={setSelectedBox}
// 							/>

// 							{/* LOADING OVERLAY */}
// 							{(isDetecting || isSearching) && (
// 								<div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 text-sm font-medium animate-pulse">
// 									<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
// 									{isDetecting ? "Đang phân tích..." : "Đang tìm kiếm..."}
// 								</div>
// 							)}

// 							{/* LIST CÁC BOX GỢI Ý (Giống Shopee) */}
// 							{candidates.length > 0 && (
// 								<div className="mt-4">
// 									<p className="text-xs font-bold text-gray-400 uppercase mb-2">
// 										Gợi ý vùng chọn:
// 									</p>
// 									<div className="flex flex-wrap gap-2">
// 										{candidates.map((cand, idx) => {
// 											const isActive =
// 												JSON.stringify(cand.box) ===
// 												JSON.stringify(selectedBox);
// 											return (
// 												<button
// 													key={idx}
// 													onClick={() => setSelectedBox(cand.box)}
// 													className={clsx(
// 														"px-3 py-1.5 text-xs rounded-full border transition-all",
// 														isActive
// 															? "bg-indigo-600 text-white border-indigo-600"
// 															: "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
// 													)}>
// 													{cand.label === "upper_body" && "Áo"}
// 													{cand.label === "lower_body" && "Quần/Váy"}
// 													{cand.label === "full_body" && "Cả bộ"}
// 													{cand.type === "merged" && " (Ghép)"}
// 												</button>
// 											);
// 										})}
// 										{/* Nút Reset về Full ảnh */}
// 										<button
// 											onClick={() => setSelectedBox(null)}
// 											className="px-3 py-1.5 text-xs rounded-full border border-dashed border-gray-300 hover:bg-gray-50">
// 											Toàn bộ ảnh
// 										</button>
// 									</div>
// 								</div>
// 							)}

// 							{/* NÚT UPLOAD LẠI */}
// 							<button
// 								onClick={resetSearch}
// 								className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
// 								<RefreshCcw size={16} /> Chọn ảnh khác
// 							</button>
// 						</div>
// 					)}
// 				</div>

// 				{/* --- CỘT PHẢI: KẾT QUẢ --- */}
// 				<div className="lg:col-span-8">
// 					{searchResults.length > 0 ? (
// 						<>
// 							<h2 className="text-lg font-bold mb-4">
// 								Kết quả tìm kiếm ({searchResults.length})
// 							</h2>
// 							<PublicProductCard product={searchResults} />
// 						</>
// 					) : (
// 						!isDetecting &&
// 						!isSearching &&
// 						originalImageUrl && (
// 							<div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
// 								<Search size={64} strokeWidth={1} />
// 								<p className="mt-2">Chưa tìm thấy sản phẩm phù hợp</p>
// 							</div>
// 						)
// 					)}

// 					{!originalImageUrl && (
// 						<div className="h-full flex flex-col items-center justify-center text-gray-300">
// 							<p>Kết quả tìm kiếm sẽ hiển thị tại đây</p>
// 						</div>
// 					)}
// 				</div>
// 			</div>
// 		</div>
// 	);
// }
