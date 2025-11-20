"use client";

import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from "react";
import {
	ChevronLeft,
	ChevronRight,
	Camera,
	Edit,
	X,
	Check,
	Trash2,
	UploadCloud,
	Image as ImageIcon,
} from "lucide-react";
import clsx from "clsx";
import { createPortal } from "react-dom";
import { buildImageUrl } from "@shared/core/utils/image.utils"; // Hàm build url ảnh của bạn
import { useProduct, ProductDetail } from "../index"; // Hook xử lý API
import { useNotification } from "@shared/core"; // Hook thông báo

interface ProductImageGalleryProps {
	productId: string;
	mode?: "client" | "shop";
	width?: string; // VD: "w-full", "w-[300px]"
	height?: string; // VD: "h-[300px]", "aspect-square"
	onImagesUpdated?: () => void; // Callback báo cho cha reload lại data
}

type ModalMode = "view" | "add" | "delete" | null;

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
	productId,
	mode = "client",
	width = "w-full",
	height = "aspect-square",
	onImagesUpdated,
}) => {
	const { updateShopProductImages, getProductDetail } = useProduct();
	const { showToast } = useNotification();

	// --- Local Data State ---
	const [product, setProduct] = useState<ProductDetail | null>(null);
	const [isLoadingProduct, setIsLoadingProduct] = useState(true);

	// --- States ---
	const [currentIndex, setCurrentIndex] = useState(0);
	const [modalMode, setModalMode] = useState<ModalMode>(null);

	// State cho Add Images
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);

	// State cho Delete Images (Lưu danh sách URL ảnh BỊ XÓA)
	const [imagesToDelete, setImagesToDelete] = useState<Set<string>>(new Set());

	const [isSubmitting, setIsSubmitting] = useState(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// --- FETCH DATA ---
	const fetchProductData = useCallback(async () => {
		if (!productId) return;
		setIsLoadingProduct(true);
		const res = await getProductDetail(productId);
		if (res.success && res.data) {
			setProduct(res.data);
		}
		setIsLoadingProduct(false);
	}, [productId, getProductDetail]);

	// Gọi API khi component mount hoặc productId thay đổi
	useEffect(() => {
		fetchProductData();
	}, [fetchProductData]);

	// --- DATA AGGREGATION (Gộp ảnh chính + ảnh biến thể) ---
	const displayImages = useMemo(() => {
		if (!product) return [];

		const mainImages = product.images || [];
		// Lọc lấy ảnh từ variants (nếu có)
		const variantImages =
			product.variants
				?.map((v) => v.image)
				.filter((img): img is string => !!img) || [];

		// Gộp lại (có thể dùng Set để unique nếu cần, ở đây giữ nguyên logic hiển thị hết)
		return [...mainImages, ...variantImages];
	}, [product]);

	// Ảnh chính dùng để chỉnh sửa (chỉ sửa được ảnh gốc, không sửa ảnh variant ở đây)
	const editableImages = useMemo(() => product?.images || [], [product]);

	// --- Carousel Logic ---
	const nextImage = useCallback(() => {
		setCurrentIndex((prev) => (prev + 1) % (displayImages.length || 1));
	}, [displayImages.length]);

	const prevImage = useCallback(() => {
		setCurrentIndex(
			(prev) =>
				(prev - 1 + (displayImages.length || 1)) % (displayImages.length || 1)
		);
	}, [displayImages.length]);

	// Auto slide 5s (Chỉ chạy ở khung nhỏ, không chạy trong Modal View)
	useEffect(() => {
		if (displayImages.length > 1 && !modalMode) {
			timerRef.current = setInterval(nextImage, 5000);
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [nextImage, displayImages.length, modalMode]);

	// Reset index nếu danh sách ảnh thay đổi
	useEffect(() => {
		if (currentIndex >= displayImages.length && displayImages.length > 0) {
			setCurrentIndex(0);
		}
	}, [displayImages.length, currentIndex]);

	// --- Handlers ---

	const handleOpenModal = (mode: ModalMode) => {
		setModalMode(mode);
		setSelectedFiles([]);
		setPreviewUrls([]);
		setImagesToDelete(new Set());
	};

	const handleCloseModal = () => {
		setModalMode(null);
		previewUrls.forEach((url) => URL.revokeObjectURL(url));
	};

	// --- LOGIC ADD (Thêm ảnh) ---
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const newFiles = Array.from(e.target.files);
			const newUrls = newFiles.map((file) => URL.createObjectURL(file));
			setSelectedFiles((prev) => [...prev, ...newFiles]);
			setPreviewUrls((prev) => [...prev, ...newUrls]);
		}
	};

	const handleRemovePreview = (index: number) => {
		const newFiles = [...selectedFiles];
		const newUrls = [...previewUrls];
		URL.revokeObjectURL(newUrls[index]); // Clean up
		newFiles.splice(index, 1);
		newUrls.splice(index, 1);
		setSelectedFiles(newFiles);
		setPreviewUrls(newUrls);
	};

	const handleSaveAdd = async () => {
		if (selectedFiles.length === 0) {
			handleCloseModal();
			return;
		}

		setIsSubmitting(true);
		const formData = new FormData();
		selectedFiles.forEach((file) => formData.append("images", file));
		formData.append("mode", "add");

		const res = await updateShopProductImages(productId, formData);
		if (res.success) {
			handleCloseModal();
			await fetchProductData(); // Reload lại data nội bộ để hiển thị ảnh mới
			onImagesUpdated?.(); // Báo ra ngoài nếu cần
		}
		setIsSubmitting(false);
	};

	// --- LOGIC DELETE (Xóa ảnh) ---
	const toggleDeleteImage = (imgUrl: string) => {
		const newSet = new Set(imagesToDelete);
		if (newSet.has(imgUrl)) newSet.delete(imgUrl);
		else newSet.add(imgUrl);
		setImagesToDelete(newSet);
	};

	const handleSaveDelete = async () => {
		if (imagesToDelete.size === 0) {
			handleCloseModal();
			return;
		}
		setIsSubmitting(true);
		// Mode "keep": Gửi lên danh sách những ảnh MUỐN GIỮ LẠI
		// keepImages = Tất cả ảnh hiện tại TRỪ những ảnh trong imagesToDelete
		const keepImages = editableImages.filter((img) => !imagesToDelete.has(img));

		const formData = new FormData();
		formData.append("keepImages", JSON.stringify(keepImages));
		formData.append("mode", "keep");

		const res = await updateShopProductImages(productId, formData);
		if (res.success) {
			handleCloseModal();
			await fetchProductData(); // Reload data
			onImagesUpdated?.();
		}
		setIsSubmitting(false);
	};

	// --- RENDER HELPERS ---
	const currentImageUrl =
		displayImages.length > 0 ? buildImageUrl(displayImages[currentIndex]) : "";

	// --- MODAL CONTENT RENDER ---
	const renderModalContent = () => {
		// === MODE VIEW (Gallery List) ===
		if (modalMode === "view") {
			return (
				<div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center outline-none">
					{/* Nút Close View */}
					<button
						onClick={handleCloseModal}
						className="absolute -top-10 right-0 z-50 p-2 text-white hover:bg-white/20 rounded-full transition-colors">
						<X size={32} />
					</button>

					{/* Ảnh Lớn */}
					<img
						src={currentImageUrl}
						alt="Gallery View"
						className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
					/>

					{/* Navigation Buttons cho Modal View */}
					{displayImages.length > 1 && (
						<>
							<button
								onClick={(e) => {
									e.stopPropagation();
									prevImage();
								}}
								className="absolute left-0 md:-left-16 p-3 text-white hover:bg-white/20 rounded-full transition-all">
								<ChevronLeft size={40} />
							</button>
							<button
								onClick={(e) => {
									e.stopPropagation();
									nextImage();
								}}
								className="absolute right-0 md:-right-16 p-3 text-white hover:bg-white/20 rounded-full transition-all">
								<ChevronRight size={40} />
							</button>
						</>
					)}

					{/* Counter */}
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-1 rounded-full text-white text-sm backdrop-blur-sm">
						{currentIndex + 1} / {displayImages.length}
					</div>
				</div>
			);
		}

		// === MODE ADD ===
		if (modalMode === "add") {
			return (
				<div className="relative w-full max-w-3xl mx-4 animate-in fade-in zoom-in duration-300">
					{/* Nút Close Floating (VIP Style) */}
					<button
						onClick={handleCloseModal}
						className={clsx(
							"absolute z-50 p-2 rounded-full text-white transition-all duration-300 shadow-lg border border-white/30 backdrop-blur-md",
							"top-2 right-2 bg-black/20 hover:bg-black/40 text-gray-600 md:text-white", // Mobile
							"md:top-0 md:-right-14 md:bg-white/20 md:hover:bg-white/40 md:hover:rotate-90" // Desktop
						)}
						title="Đóng">
						<X size={24} strokeWidth={2.5} />
					</button>

					<div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
						{/* Header */}
						<div className="p-6 pb-2">
							<h3 className="font-extrabold text-2xl text-gray-800 flex items-center gap-3">
								<div className="p-3 bg-blue-50 rounded-xl text-blue-600">
									<Camera size={28} />
								</div>
								Thêm ảnh sản phẩm
							</h3>
							<p className="text-gray-500 text-sm mt-1 ml-14">
								Tải lên hình ảnh chất lượng cao để thu hút khách hàng.
							</p>
						</div>

						{/* Body */}
						<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
							{/* Upload Area - Dashed Border Animation */}
							<label className="group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 mb-8 relative overflow-hidden">
								<div className="absolute inset-0 bg-blue-100/0 group-hover:bg-blue-100/20 transition-colors" />
								<div className="flex flex-col items-center justify-center pt-5 pb-6 text-blue-500 z-10 transform group-hover:scale-110 transition-transform duration-300">
									<UploadCloud
										size={48}
										strokeWidth={1.5}
										className="mb-3 drop-shadow-sm"
									/>
									<p className="text-base font-semibold">Nhấn để tải ảnh lên</p>
									<p className="text-xs text-blue-400 mt-1 font-medium">
										(Hỗ trợ chọn nhiều ảnh)
									</p>
								</div>
								<input
									type="file"
									className="hidden"
									multiple
									accept="image/*"
									onChange={handleFileChange}
								/>
							</label>

							{/* Preview Grid */}
							{previewUrls.length > 0 && (
								<div className="grid grid-cols-3 sm:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
									{previewUrls.map((url, idx) => (
										<div
											key={idx}
											className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-all">
											<img
												src={url}
												alt="preview"
												className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
											/>
											{/* X Button on Image */}
											<button
												onClick={() => handleRemovePreview(idx)}
												className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:scale-110 transition-all shadow-md backdrop-blur-sm">
												<X size={14} strokeWidth={3} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Footer Actions */}
						<div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-4 bg-gray-50/50">
							<button
								onClick={handleCloseModal}
								className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md hover:bg-gray-200 hover:scale-105 transition-all duration-200">
								<X className="w-5 h-5" />
								Hủy bỏ
							</button>
							<button
								onClick={handleSaveAdd}
								disabled={isSubmitting || selectedFiles.length === 0}
								className="flex items-center gap-2 px-5 py-2 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-200">
								{isSubmitting ? (
									<>
										{" "}
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
										Đang lưu...{" "}
									</>
								) : (
									<>
										{" "}
										<Check className="w-5 h-5" strokeWidth={3} /> Lưu ảnh{" "}
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			);
		}

		// === MODE DELETE (Edit) ===
		if (modalMode === "delete") {
			return (
				<div className="relative w-full max-w-3xl mx-4 animate-in fade-in zoom-in duration-300">
					{/* Nút Close Floating (VIP Style) */}
					<button
						onClick={handleCloseModal}
						className={clsx(
							"absolute z-50 p-2 rounded-full text-white transition-all duration-300 shadow-lg border border-white/30 backdrop-blur-md",
							"top-2 right-2 bg-black/20 hover:bg-black/40 text-gray-600 md:text-white", // Mobile
							"md:top-0 md:-right-14 md:bg-white/20 md:hover:bg-white/40 md:hover:rotate-90" // Desktop
						)}
						title="Đóng">
						<X size={24} strokeWidth={2.5} />
					</button>

					<div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
						{/* Header */}
						<div className="p-6 pb-2">
							<h3 className="font-extrabold text-2xl text-gray-800 flex items-center gap-3">
								<div className="p-3 bg-red-50 rounded-xl text-red-600">
									<Edit size={28} />
								</div>
								Quản lý hình ảnh
							</h3>
							<p className="text-gray-500 text-sm mt-1 ml-14">
								Chọn ảnh bạn muốn xóa khỏi sản phẩm.
							</p>
						</div>

						{/* Body */}
						<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
							<div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start text-amber-800">
								<div className="mt-0.5 min-w-[20px]">
									<div className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs">
										!
									</div>
								</div>
								<p className="text-sm leading-relaxed">
									<b>Lưu ý:</b> Bạn chỉ có thể xóa <b>ảnh gốc</b> của sản phẩm
									tại đây. Ảnh của biến thể (màu sắc/size) cần được chỉnh sửa
									trong mục quản lý biến thể.
								</p>
							</div>

							<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
								{editableImages.map((img, idx) => {
									const isSelected = imagesToDelete.has(img);
									return (
										<div
											key={idx}
											onClick={() => toggleDeleteImage(img)}
											className={clsx(
												"relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group",
												isSelected
													? "ring-4 ring-red-500 ring-offset-2 scale-95 shadow-none" // Selected State
													: "hover:shadow-lg hover:-translate-y-1 border border-gray-100" // Normal State
											)}>
											<img
												src={buildImageUrl(img)}
												alt="edit"
												className={clsx(
													"w-full h-full object-cover transition-all duration-500",
													isSelected
														? "opacity-50 grayscale"
														: "group-hover:scale-110"
												)}
											/>

											{/* Checkbox Indicator (VIP) */}
											<div
												className={clsx(
													"absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-10",
													isSelected
														? "bg-red-500 scale-110"
														: "bg-white/90 backdrop-blur-sm border border-gray-200"
												)}>
												{isSelected && (
													<Check
														size={16}
														strokeWidth={4}
														className="text-white"
													/>
												)}
											</div>

											{/* Trash Overlay Indicator */}
											{isSelected && (
												<div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-200">
													<div className="bg-white/90 p-3 rounded-full shadow-xl">
														<Trash2
															className="text-red-600"
															size={28}
															strokeWidth={2}
														/>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
							{editableImages.length === 0 && (
								<div className="flex flex-col items-center justify-center py-12 opacity-50">
									<Camera size={48} className="mb-2 text-gray-400" />
									<p className="text-gray-500 italic">
										Sản phẩm này chưa có ảnh chính nào.
									</p>
								</div>
							)}
						</div>

						{/* Footer Actions */}
						<div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-4 bg-gray-50/50">
							<button
								onClick={handleCloseModal}
								className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md hover:bg-gray-200 hover:scale-105 transition-all duration-200">
								<X className="w-5 h-5" />
								Hủy bỏ
							</button>
							<button
								onClick={handleSaveDelete}
								disabled={isSubmitting || imagesToDelete.size === 0}
								className="flex items-center gap-2 px-5 py-2 text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-lg hover:from-red-600 hover:to-pink-700 hover:scale-105 transition-all duration-200">
								{isSubmitting ? (
									<>
										{" "}
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
										Đang xóa...{" "}
									</>
								) : (
									<>
										{" "}
										<Trash2 className="w-5 h-5" strokeWidth={2} /> Xóa (
										{imagesToDelete.size}) ảnh{" "}
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			);
		}
		return null;
	};

	// --- LOADING STATE ---
	if (isLoadingProduct) {
		return (
			<div
				className={clsx("bg-gray-200 animate-pulse rounded-xl", width, height)}
			/>
		);
	}

	// --- MAIN RENDER ---
	return (
		<>
			{/* KHUNG CHÍNH HIỂN THỊ ẢNH */}
			<div
				className={clsx(
					"relative flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden group",
					width,
					height
				)}>
				{/* Ảnh nền chính */}
				<div
					className="w-full h-full flex items-center justify-center cursor-pointer"
					onClick={() =>
						displayImages.length > 0 &&
						handleOpenModal(mode === "client" ? "view" : "view")
					} // Cả client và shop đều xem được ảnh lớn
				>
					{displayImages.length > 0 ? (
						<img
							src={currentImageUrl}
							alt="Product"
							className="w-full h-full object-contain transition-transform duration-500"
						/>
					) : (
						// --- GIAO DIỆN KHI KHÔNG CÓ ẢNH ---
						<div className="flex flex-col items-center justify-center text-gray-400 select-none animate-in fade-in">
							<ImageIcon
								size={48}
								strokeWidth={1.5}
								className="mb-2 opacity-50"
							/>
							<span className="text-xs font-medium uppercase tracking-wider opacity-60">
								Chưa có ảnh
							</span>
						</div>
					)}
				</div>

				{/* Navigation Buttons (Chỉ hiện nếu có > 1 ảnh) */}
				{displayImages.length > 1 && (
					<>
						<button
							onClick={(e) => {
								e.stopPropagation();
								prevImage();
							}}
							className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
							<ChevronLeft size={20} />
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation();
								nextImage();
							}}
							className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
							<ChevronRight size={20} />
						</button>

						{/* Pagination Dots */}
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
							{displayImages.map((_, idx) => (
								<div
									key={idx}
									className={clsx(
										"h-1.5 rounded-full transition-all",
										idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
									)}
								/>
							))}
						</div>
					</>
				)}

				{/* SHOP ACTION BUTTONS */}
				{mode === "shop" && (
					<div className="absolute bottom-3 left-3 flex gap-3 z-20">
						{/* Nút Sửa (Chỉ hiện nếu có ảnh chính để sửa) */}
						{editableImages.length > 0 && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									handleOpenModal("delete");
								}}
								className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
								title="Sửa / Xóa ảnh">
								<Edit size={18} />
							</button>
						)}

						{/* Nút Thêm */}
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleOpenModal("add");
							}}
							className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
							title="Thêm ảnh mới">
							<Camera size={18} />
						</button>
					</div>
				)}
			</div>

			{/* MODAL OVERLAY */}
			{modalMode &&
				createPortal(
					<div
						className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
						onClick={handleCloseModal}>
						<div
							onClick={(e) => e.stopPropagation()}
							className="relative w-full flex justify-center">
							{renderModalContent()}
						</div>
					</div>,
					document.body
				)}
		</>
	);
};

// "use client";

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import {
// 	ChevronLeft,
// 	ChevronRight,
// 	Camera,
// 	Edit,
// 	X,
// 	Check,
// 	Trash2,
// 	UploadCloud,
// } from "lucide-react";
// import clsx from "clsx";
// import { createPortal } from "react-dom";
// import { buildImageUrl } from "@shared/core/utils/image.utils"; // Hàm build url ảnh của bạn
// import { useProduct } from "../index"; // Hook xử lý API
// import { useNotification } from "@shared/core"; // Hook thông báo

// interface ProductImageGalleryProps {
// 	images: string[];
// 	productId: string;
// 	mode?: "client" | "shop";
// 	width?: string; // VD: "w-full", "w-[300px]"
// 	height?: string; // VD: "h-[300px]", "aspect-square"
// 	onImagesUpdated?: () => void; // Callback báo cho cha reload lại data
// }

// type ModalMode = "view" | "add" | "delete" | null;

// export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
// 	images = [],
// 	productId,
// 	mode = "client",
// 	width = "w-full",
// 	height = "aspect-square",
// 	onImagesUpdated,
// }) => {
// 	const { updateShopProductImages } = useProduct();
// 	const { showToast } = useNotification();
// 	// --- States ---
// 	const [currentIndex, setCurrentIndex] = useState(0);
// 	const [modalMode, setModalMode] = useState<ModalMode>(null);

// 	// State cho Add Images
// 	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
// 	const [previewUrls, setPreviewUrls] = useState<string[]>([]);

// 	// State cho Delete Images (Lưu danh sách URL ảnh BỊ XÓA)
// 	const [imagesToDelete, setImagesToDelete] = useState<Set<string>>(new Set());

// 	const [isSubmitting, setIsSubmitting] = useState(false);
// 	const timerRef = useRef<NodeJS.Timeout | null>(null);

// 	// --- Carousel Logic ---
// 	const nextImage = useCallback(() => {
// 		setCurrentIndex((prev) => (prev + 1) % (images.length || 1));
// 	}, [images.length]);

// 	const prevImage = useCallback(() => {
// 		setCurrentIndex(
// 			(prev) => (prev - 1 + (images.length || 1)) % (images.length || 1)
// 		);
// 	}, [images.length]);

// 	// Auto slide 5s
// 	useEffect(() => {
// 		if (images.length > 1 && !modalMode) {
// 			timerRef.current = setInterval(nextImage, 5000);
// 		}
// 		return () => {
// 			if (timerRef.current) clearInterval(timerRef.current);
// 		};
// 	}, [nextImage, images.length, modalMode]);

// 	// Reset index nếu ảnh thay đổi
// 	useEffect(() => {
// 		if (currentIndex >= images.length && images.length > 0) {
// 			setCurrentIndex(0);
// 		}
// 	}, [images, currentIndex]);

// 	// --- Handlers ---

// 	const handleOpenModal = (mode: ModalMode) => {
// 		setModalMode(mode);
// 		// Reset states
// 		setSelectedFiles([]);
// 		setPreviewUrls([]);
// 		setImagesToDelete(new Set());
// 	};

// 	const handleCloseModal = () => {
// 		setModalMode(null);
// 		// Revoke object urls để tránh leak mem
// 		previewUrls.forEach((url) => URL.revokeObjectURL(url));
// 	};

// 	// --- LOGIC ADD (Thêm ảnh) ---
// 	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// 		if (e.target.files && e.target.files.length > 0) {
// 			const newFiles = Array.from(e.target.files);
// 			const newUrls = newFiles.map((file) => URL.createObjectURL(file));

// 			setSelectedFiles((prev) => [...prev, ...newFiles]);
// 			setPreviewUrls((prev) => [...prev, ...newUrls]);
// 		}
// 	};

// 	const handleRemovePreview = (index: number) => {
// 		const newFiles = [...selectedFiles];
// 		const newUrls = [...previewUrls];

// 		URL.revokeObjectURL(newUrls[index]); // Clean up
// 		newFiles.splice(index, 1);
// 		newUrls.splice(index, 1);

// 		setSelectedFiles(newFiles);
// 		setPreviewUrls(newUrls);
// 	};

// 	const handleSaveAdd = async () => {
// 		if (selectedFiles.length === 0) {
// 			handleCloseModal();
// 			return;
// 		}

// 		setIsSubmitting(true);
// 		const formData = new FormData();
// 		selectedFiles.forEach((file) => formData.append("images", file));
// 		formData.append("mode", "add");

// 		const res = await updateShopProductImages(productId, formData);
// 		setIsSubmitting(false);

// 		if (res.success) {
// 			handleCloseModal();
// 			onImagesUpdated?.();
// 		}
// 	};

// 	// --- LOGIC DELETE (Xóa ảnh) ---
// 	const toggleDeleteImage = (imgUrl: string) => {
// 		const newSet = new Set(imagesToDelete);
// 		if (newSet.has(imgUrl)) {
// 			newSet.delete(imgUrl);
// 		} else {
// 			newSet.add(imgUrl);
// 		}
// 		setImagesToDelete(newSet);
// 	};

// 	const handleSaveDelete = async () => {
// 		if (imagesToDelete.size === 0) {
// 			handleCloseModal();
// 			return;
// 		}

// 		setIsSubmitting(true);
// 		// Mode "keep": Gửi lên danh sách những ảnh MUỐN GIỮ LẠI
// 		// keepImages = Tất cả ảnh hiện tại TRỪ những ảnh trong imagesToDelete
// 		const keepImages = images.filter((img) => !imagesToDelete.has(img));

// 		const formData = new FormData();
// 		formData.append("keepImages", JSON.stringify(keepImages));
// 		formData.append("mode", "keep"); // Quan trọng

// 		const res = await updateShopProductImages(productId, formData);
// 		setIsSubmitting(false);

// 		if (res.success) {
// 			handleCloseModal();
// 			onImagesUpdated?.();
// 		}
// 	};

// 	// --- RENDER HELPERS ---
// 	const currentImageUrl =
// 		images.length > 0
// 			? buildImageUrl(images[currentIndex])
// 			: "/images/placeholder-product.png";

// 	// --- MODAL CONTENT RENDER ---
// 	const renderModalContent = () => {
// 		if (modalMode === "view") {
// 			return (
// 				<div className="w-full max-w-4xl flex items-center justify-center">
// 					<img
// 						src={currentImageUrl}
// 						alt="Large View"
// 						className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
// 					/>
// 				</div>
// 			);
// 		}

// 		if (modalMode === "add") {
// 			return (
// 				<div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
// 					<div className="p-4 border-b flex justify-between items-center bg-gray-50">
// 						<h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
// 							<Camera size={20} /> Thêm ảnh sản phẩm
// 						</h3>
// 						<button
// 							onClick={handleCloseModal}
// 							className="p-1 hover:bg-gray-200 rounded-full">
// 							<X size={20} />
// 						</button>
// 					</div>

// 					<div className="p-6 overflow-y-auto flex-1">
// 						{/* Upload Area */}
// 						<label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors mb-6">
// 							<div className="flex flex-col items-center justify-center pt-5 pb-6 text-blue-500">
// 								<UploadCloud size={32} className="mb-2" />
// 								<p className="text-sm font-medium">
// 									Nhấn để tải ảnh lên (Chọn nhiều)
// 								</p>
// 							</div>
// 							<input
// 								type="file"
// 								className="hidden"
// 								multiple
// 								accept="image/*"
// 								onChange={handleFileChange}
// 							/>
// 						</label>

// 						{/* Preview Grid */}
// 						{previewUrls.length > 0 && (
// 							<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
// 								{previewUrls.map((url, idx) => (
// 									<div
// 										key={idx}
// 										className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
// 										<img
// 											src={url}
// 											alt="preview"
// 											className="w-full h-full object-cover"
// 										/>
// 										<button
// 											onClick={() => handleRemovePreview(idx)}
// 											className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
// 											<X size={14} />
// 										</button>
// 									</div>
// 								))}
// 							</div>
// 						)}
// 					</div>

// 					<div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
// 						<button
// 							onClick={handleCloseModal}
// 							className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md hover:bg-gray-200 hover:scale-105 transition-all duration-200">
// 							<X className="w-5 h-5" />
// 							Hủy
// 						</button>
// 						<button
// 							onClick={handleSaveAdd}
// 							disabled={isSubmitting || selectedFiles.length === 0}
// 							className="flex cursor-pointer items-center gap-2 px-5 py-2 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-200">
// 							<Check className="w-5 h-5" />
// 							{isSubmitting ? "Đang lưu..." : "Lưu ảnh"}
// 						</button>
// 					</div>
// 				</div>
// 			);
// 		}

// 		if (modalMode === "delete") {
// 			return (
// 				<div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
// 					<div className="p-4 border-b flex justify-between items-center bg-gray-50">
// 						<h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
// 							<Edit size={20} /> Xóa / Chỉnh sửa ảnh
// 						</h3>
// 						<button
// 							onClick={handleCloseModal}
// 							className="p-1 hover:bg-gray-200 rounded-full">
// 							<X size={20} />
// 						</button>
// 					</div>

// 					<div className="p-6 overflow-y-auto flex-1">
// 						<p className="text-sm text-gray-500 mb-4">
// 							Chọn những ảnh bạn muốn{" "}
// 							<span className="text-red-600 font-bold">XÓA</span> khỏi hệ thống:
// 						</p>
// 						<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
// 							{images.map((img, idx) => {
// 								const isSelected = imagesToDelete.has(img);
// 								return (
// 									<div
// 										key={idx}
// 										onClick={() => toggleDeleteImage(img)}
// 										className={clsx(
// 											"relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
// 											isSelected
// 												? "border-red-500 opacity-60"
// 												: "border-gray-200 hover:border-blue-400"
// 										)}>
// 										<img
// 											src={buildImageUrl(img)}
// 											alt="edit"
// 											className="w-full h-full object-cover"
// 										/>
// 										{/* Checkbox Style Indicator */}
// 										<div
// 											className={clsx(
// 												"absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 bg-white",
// 												isSelected ? "border-red-500" : "border-gray-300"
// 											)}>
// 											{isSelected && (
// 												<div className="w-3 h-3 bg-red-500 rounded-full" />
// 											)}
// 										</div>
// 										{isSelected && (
// 											<div className="absolute inset-0 bg-red-100/20 flex items-center justify-center">
// 												<Trash2 className="text-red-600" size={32} />
// 											</div>
// 										)}
// 									</div>
// 								);
// 							})}
// 						</div>
// 					</div>

// 					<div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
// 						<button
// 							onClick={handleCloseModal}
// 							className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium">
// 							Hủy
// 						</button>
// 						<button
// 							onClick={handleSaveDelete}
// 							disabled={isSubmitting || imagesToDelete.size === 0}
// 							className="px-6 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
// 							{isSubmitting ? "Đang xử lý..." : "Xóa đã chọn"}
// 						</button>
// 					</div>
// 				</div>
// 			);
// 		}
// 		return null;
// 	};

// 	// --- MAIN RENDER ---
// 	return (
// 		<>
// 			{/* KHUNG CHÍNH HIỂN THỊ ẢNH */}
// 			<div
// 				className={clsx(
// 					"relative flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden group",
// 					width,
// 					height
// 				)}>
// 				{/* Ảnh nền chính - Click để xem lớn (Client) */}
// 				<div
// 					className="w-full h-full flex items-center justify-center cursor-pointer"
// 					onClick={() => handleOpenModal(mode === "client" ? "view" : null)}>
// 					<img
// 						src={currentImageUrl}
// 						alt="Product"
// 						className="w-full h-full object-contain transition-transform duration-500"
// 					/>
// 				</div>

// 				{/* Navigation Buttons (Chỉ hiện nếu có > 1 ảnh) */}
// 				{images.length > 1 && (
// 					<>
// 						<button
// 							onClick={(e) => {
// 								e.stopPropagation();
// 								prevImage();
// 							}}
// 							className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
// 							<ChevronLeft size={20} />
// 						</button>
// 						<button
// 							onClick={(e) => {
// 								e.stopPropagation();
// 								nextImage();
// 							}}
// 							className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
// 							<ChevronRight size={20} />
// 						</button>

// 						{/* Pagination Dots */}
// 						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
// 							{images.map((_, idx) => (
// 								<div
// 									key={idx}
// 									className={clsx(
// 										"h-1.5 rounded-full transition-all",
// 										idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
// 									)}
// 								/>
// 							))}
// 						</div>
// 					</>
// 				)}

// 				{/* SHOP ACTION BUTTONS (Bottom Left) */}
// 				{mode === "shop" && (
// 					<div className="absolute bottom-3 left-3 flex gap-3 z-20">
// 						{/* Nút Sửa (Mở modal xóa) */}
// 						{images.length > 0 && (
// 							<button
// 								onClick={(e) => {
// 									e.stopPropagation();
// 									handleOpenModal("delete");
// 								}}
// 								className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
// 								title="Sửa / Xóa ảnh">
// 								<Edit size={18} />
// 							</button>
// 						)}

// 						{/* Nút Thêm (Mở modal thêm) */}
// 						<button
// 							onClick={(e) => {
// 								e.stopPropagation();
// 								handleOpenModal("add");
// 							}}
// 							className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
// 							title="Thêm ảnh mới">
// 							<Camera size={18} />
// 						</button>
// 					</div>
// 				)}
// 			</div>

// 			{/* MODAL OVERLAY (Portal ra ngoài body) */}
// 			{modalMode &&
// 				createPortal(
// 					<div
// 						className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
// 						onClick={handleCloseModal}>
// 						{/* Stop propagation để click vào modal không bị đóng */}
// 						<div onClick={(e) => e.stopPropagation()} className="relative">
// 							{renderModalContent()}
// 						</div>
// 					</div>,
// 					document.body
// 				)}
// 		</>
// 	);
// };
