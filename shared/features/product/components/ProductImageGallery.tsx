"use client";

import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from "react";
import { useFormContext } from "react-hook-form";
import {
	ChevronLeft,
	ChevronRight,
	Camera,
	Edit,
	X,
	Check,
	Trash2,
	UploadCloud,
	Sparkles,
	Image as ImageIcon,
} from "lucide-react";
import clsx from "clsx";
import { createPortal } from "react-dom";
import { buildImageUrl } from "@shared/core/utils/image.utils";
import { useProduct, ProductDetail } from "../index";
// Import Component mới
import { ImageWithFallback } from "@shared/core/components/ui/ImageWithFallback";

interface ProductImageGalleryProps {
	productId?: string;
	mode?: "client" | "shop";
	createMode?: boolean;
	width?: string;
	height?: string;
	onImagesUpdated?: () => void;
	activeImage?: string | null;
}

type ModalMode = "view" | "add" | "delete" | null;

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
	productId,
	mode = "client",
	createMode = false,
	width = "w-full",
	height = "aspect-square",
	onImagesUpdated,
	activeImage,
}) => {
	const { updateShopProductImages, getProductDetail } = useProduct();
	const formContext = createMode ? useFormContext() : null;

	const [product, setProduct] = useState<ProductDetail | null>(null);
	const [isLoadingProduct, setIsLoadingProduct] = useState(!createMode);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [modalMode, setModalMode] = useState<ModalMode>(null);

	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
	const [imagesToDelete, setImagesToDelete] = useState<Set<string>>(new Set());
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [createFiles, setCreateFiles] = useState<File[]>([]);
	const [createPreviewUrls, setCreatePreviewUrls] = useState<string[]>([]);

	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// Fetch data
	const fetchProductData = useCallback(async () => {
		if (createMode || !productId) {
			setIsLoadingProduct(false);
			return;
		}
		setIsLoadingProduct(true);
		const res = await getProductDetail(productId);
		if (res.success && res.data) {
			setProduct(res.data);
		}
		setIsLoadingProduct(false);
	}, [productId, getProductDetail, createMode]);

	useEffect(() => {
		fetchProductData();
	}, [fetchProductData]);

	// --- DATA AGGREGATION ---
	const displayImages = useMemo(() => {
		if (createMode) return createPreviewUrls;
		if (!product) return [];
		const mainImages = product.images || [];

		// Logic ưu tiên ảnh variant (activeImage)
		if (activeImage) {
			// Chuẩn hóa để so sánh chính xác (bỏ qua domain nếu có)
			const isImageInMain = mainImages.some(
				(img) => buildImageUrl(img) === buildImageUrl(activeImage)
			);

			if (!isImageInMain) {
				return [activeImage, ...mainImages];
			}
			return mainImages;
		}
		return mainImages;
	}, [product, createMode, createPreviewUrls, activeImage]);

	const editableImages = useMemo(() => {
		if (createMode) return createPreviewUrls;
		return product?.images || [];
	}, [product, createMode, createPreviewUrls]);

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

	useEffect(() => {
		if (displayImages.length > 1 && !modalMode && !activeImage) {
			timerRef.current = setInterval(nextImage, 5000);
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [nextImage, displayImages.length, modalMode, activeImage]);

	useEffect(() => {
		if (currentIndex >= displayImages.length && displayImages.length > 0) {
			setCurrentIndex(0);
		}
	}, [displayImages.length, currentIndex]);

	// Sync activeImage với slider
	useEffect(() => {
		if (activeImage && displayImages.length > 0) {
			const activeUrl = buildImageUrl(activeImage);
			const index = displayImages.findIndex(
				(img) => buildImageUrl(img) === activeUrl || img === activeImage
			);
			if (index !== -1) setCurrentIndex(index);
		}
	}, [activeImage, displayImages]);

	// --- MODAL HANDLERS (Giữ nguyên logic upload/delete) ---
	const handleOpenModal = (mode: ModalMode) => {
		setModalMode(mode);
		setSelectedFiles([]);
		setPreviewUrls([]);
		setImagesToDelete(new Set());
	};

	const handleCloseModal = () => {
		setModalMode(null);
		if (modalMode === "add") {
			previewUrls.forEach((url) => URL.revokeObjectURL(url));
		}
		setSelectedFiles([]);
		setPreviewUrls([]);
		setImagesToDelete(new Set());
	};

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
		URL.revokeObjectURL(newUrls[index]);
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
		if (createMode) {
			const newTotalFiles = [...createFiles, ...selectedFiles];
			const newTotalUrls = [...createPreviewUrls, ...previewUrls];
			setCreateFiles(newTotalFiles);
			setCreatePreviewUrls(newTotalUrls);
			if (formContext) {
				formContext.setValue("images", newTotalFiles, {
					shouldValidate: true,
					shouldDirty: true,
				});
			}
			setModalMode(null);
			setSelectedFiles([]);
			setPreviewUrls([]);
			setImagesToDelete(new Set());
			return;
		}
		setIsSubmitting(true);
		const formData = new FormData();
		selectedFiles.forEach((file) => formData.append("images", file));
		formData.append("mode", "add");
		if (productId) {
			const res = await updateShopProductImages(productId, formData);
			if (res.success) {
				handleCloseModal();
				await fetchProductData();
				onImagesUpdated?.();
			}
		}
		setIsSubmitting(false);
	};

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
		if (createMode) {
			const newFiles: File[] = [];
			const newUrls: string[] = [];
			createPreviewUrls.forEach((url, index) => {
				if (!imagesToDelete.has(url)) {
					newFiles.push(createFiles[index]);
					newUrls.push(url);
				} else {
					URL.revokeObjectURL(url);
				}
			});
			setCreateFiles(newFiles);
			setCreatePreviewUrls(newUrls);
			if (formContext) {
				formContext.setValue("images", newFiles, {
					shouldValidate: true,
					shouldDirty: true,
				});
			}
			setModalMode(null);
			setImagesToDelete(new Set());
			return;
		}
		setIsSubmitting(true);
		const keepImages = editableImages.filter((img) => !imagesToDelete.has(img));
		const formData = new FormData();
		formData.append("keepImages", JSON.stringify(keepImages));
		formData.append("mode", "keep");
		if (productId) {
			const res = await updateShopProductImages(productId, formData);
			if (res.success) {
				handleCloseModal();
				await fetchProductData();
				onImagesUpdated?.();
			}
		}
		setIsSubmitting(false);
	};

	// Helper lấy URL ảnh
	const getImageUrl = (src: string) => {
		if (!src) return "";
		if (src.startsWith("blob:")) return src;
		// buildImageUrl đã được gọi bên trong ImageWithFallback rồi, nhưng ở đây
		// ta gọi để render modal (hoặc logic khác nếu cần URL string raw)
		return src;
	};

	const currentSrcRaw = displayImages[currentIndex];

	if (isLoadingProduct) {
		return (
			<div
				className={clsx("bg-gray-200 animate-pulse rounded-xl", width, height)}
			/>
		);
	}

	// --- RENDER MODAL CONTENT ---
	const renderModalContent = () => {
		if (modalMode === "view") {
			return (
				<div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center outline-none">
					<button
						onClick={handleCloseModal}
						className="absolute -top-10 right-0 z-50 p-2 text-white hover:bg-white/20 rounded-full transition-colors">
						<X size={32} />
					</button>

					{/* Thay thế img thường bằng ImageWithFallback trong Modal View */}
					{currentSrcRaw && (
						<div className="max-w-full max-h-full w-full h-full flex items-center justify-center">
							<ImageWithFallback
								src={currentSrcRaw}
								alt="Gallery View"
								className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
								fallbackClassName="bg-transparent text-white" // Style riêng cho modal (nền tối)
							/>
						</div>
					)}

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
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-1 rounded-full text-white text-sm backdrop-blur-sm">
						{currentIndex + 1} / {displayImages.length}
					</div>
				</div>
			);
		}

		if (modalMode === "add") {
			// ... (Giữ nguyên logic Add Modal vì chủ yếu là preview blob, ImageWithFallback vẫn dùng được)
			// Tạm thời giữ nguyên code cũ cho modal Add vì nó phức tạp với file input
			return (
				<div className="relative w-full max-w-3xl mx-4 animate-in fade-in zoom-in duration-300">
					<button
						onClick={handleCloseModal}
						className={clsx(
							"absolute z-50 p-2 rounded-full text-white top-2 right-2 bg-black/20 hover:bg-black/40 md:top-0 md:-right-14 md:bg-white/20 md:hover:bg-white/40"
						)}>
						<X size={24} strokeWidth={2.5} />
					</button>
					<div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
						{/* Header & Body (Upload area) */}
						<div className="p-6 pb-2">
							<h3 className="font-extrabold text-2xl text-gray-800 flex items-center gap-3">
								<div className="p-3 bg-blue-50 rounded-xl text-blue-600">
									<Camera size={28} />
								</div>
								Thêm ảnh sản phẩm
							</h3>
						</div>
						<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
							{/* ... (Upload Input Area giữ nguyên) ... */}
							<label className="group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer bg-blue-50/50 hover:bg-blue-50 mb-8">
								<UploadCloud size={48} className="text-blue-500 mb-2" />
								<span className="text-blue-500 font-semibold">Tải ảnh lên</span>
								<input
									type="file"
									className="hidden"
									multiple
									accept="image/*"
									onChange={handleFileChange}
								/>
							</label>

							{previewUrls.length > 0 && (
								<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
									{previewUrls.map((url, idx) => (
										<div
											key={idx}
											className="relative aspect-square rounded-xl overflow-hidden shadow-sm border">
											<img
												src={url}
												alt="preview"
												className="w-full h-full object-cover"
											/>
											<button
												onClick={() => handleRemovePreview(idx)}
												className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
												<X size={14} />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
						{/* Footer */}
						<div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-4 bg-gray-50/50">
							<button
								onClick={handleCloseModal}
								className="px-5 py-2 bg-gray-100 rounded-full">
								Hủy
							</button>
							<button
								onClick={handleSaveAdd}
								disabled={isSubmitting || selectedFiles.length === 0}
								className="px-5 py-2 bg-blue-600 text-white rounded-full">
								{isSubmitting ? "Lưu..." : "Lưu ảnh"}
							</button>
						</div>
					</div>
				</div>
			);
		}

		if (modalMode === "delete") {
			// ... (Giữ nguyên modal Delete)
			// Có thể thay img bằng ImageWithFallback để hiển thị đẹp hơn
			return (
				<div className="relative w-full max-w-3xl mx-4 animate-in fade-in zoom-in duration-300">
					<button
						onClick={handleCloseModal}
						className={clsx(
							"absolute z-50 p-2 rounded-full text-white top-2 right-2 bg-black/20 md:top-0 md:-right-14 md:bg-white/20"
						)}>
						<X size={24} strokeWidth={2.5} />
					</button>
					<div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
						<div className="p-6 pb-2">
							<h3 className="font-extrabold text-2xl text-gray-800 flex gap-3">
								<div className="p-3 bg-red-50 text-red-600 rounded-xl">
									<Edit size={28} />
								</div>
								Quản lý hình ảnh
							</h3>
						</div>
						<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
							<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
								{editableImages.map((img, idx) => {
									const isSelected = imagesToDelete.has(img);
									return (
										<div
											key={idx}
											onClick={() => toggleDeleteImage(img)}
											className={clsx(
												"relative aspect-square rounded-xl overflow-hidden cursor-pointer group",
												isSelected ? "ring-4 ring-red-500 scale-95" : "border"
											)}>
											{/* SỬ DỤNG IMAGE WITH FALLBACK */}
											<ImageWithFallback
												src={img}
												alt="edit"
												className={clsx(
													"w-full h-full object-cover",
													isSelected && "opacity-50 grayscale"
												)}
											/>

											{isSelected && (
												<div className="absolute inset-0 flex items-center justify-center">
													<div className="bg-white/90 p-2 rounded-full">
														<Trash2 className="text-red-600" />
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
						<div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-4 bg-gray-50/50">
							<button
								onClick={handleCloseModal}
								className="px-5 py-2 bg-gray-100 rounded-full">
								Hủy
							</button>
							<button
								onClick={handleSaveDelete}
								disabled={isSubmitting || imagesToDelete.size === 0}
								className="px-5 py-2 bg-red-500 text-white rounded-full">
								{isSubmitting
									? "Đang xóa..."
									: `Xóa (${imagesToDelete.size}) ảnh`}
							</button>
						</div>
					</div>
				</div>
			);
		}
		return null;
	};

	return (
		<>
			<div
				className={clsx(
					"relative flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden group",
					width,
					height
				)}>
				<div
					className="w-full h-full flex items-center justify-center cursor-pointer relative"
					onClick={() => displayImages.length > 0 && handleOpenModal("view")}>
					{/* --- LOGIC HIỂN THỊ CHÍNH --- */}
					{/* Thay thế toàn bộ logic if/else img cũ bằng ImageWithFallback */}
					{/* Component này tự handle: nếu src null -> hiện fallback, nếu src lỗi -> hiện fallback */}

					{displayImages.length > 0 ? (
						<ImageWithFallback
							src={currentSrcRaw}
							alt="Product"
							className="w-full h-full object-contain transition-transform duration-500"
						/>
					) : (
						// Trường hợp mảng rỗng hoàn toàn (chưa có ảnh nào) -> Hiện icon rỗng
						<div className="flex flex-col items-center justify-center text-gray-400 select-none">
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

				{(mode === "shop" || createMode) && (
					<div className="absolute bottom-3 left-3 flex gap-3 z-20">
						{editableImages.length > 0 && (
							<button
								onClick={(e) => {
									e.stopPropagation();
									handleOpenModal("delete");
								}}
								className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white p-2.5 rounded-full shadow-lg transition-transform"
								title="Sửa / Xóa ảnh">
								<Edit size={18} />
							</button>
						)}
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleOpenModal("add");
							}}
							className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-2.5 rounded-full shadow-lg transition-transform">
							<Camera size={18} />
						</button>
					</div>
				)}
			</div>

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

// import React, {
// 	useState,
// 	useEffect,
// 	useRef,
// 	useCallback,
// 	useMemo,
// } from "react";
// import { useFormContext } from "react-hook-form";
// import {
// 	ChevronLeft,
// 	ChevronRight,
// 	Camera,
// 	Edit,
// 	X,
// 	Check,
// 	Trash2,
// 	UploadCloud,
// 	Sparkles,
// 	Image as ImageIcon,
// 	Shirt,
// 	ImageOff,
// } from "lucide-react";
// import clsx from "clsx";
// import { createPortal } from "react-dom";
// import { buildImageUrl } from "@shared/core/utils/image.utils";
// import { useProduct, ProductDetail } from "../index";
// import { SidebarTooltip } from "@shared/index";

// interface ProductImageGalleryProps {
// 	productId?: string;
// 	mode?: "client" | "shop";
// 	createMode?: boolean;
// 	width?: string;
// 	height?: string;
// 	onImagesUpdated?: () => void;
// 	activeImage?: string | null;
// }

// type ModalMode = "view" | "add" | "delete" | null;

// export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
// 	productId,
// 	mode = "client",
// 	createMode = false,
// 	width = "w-full",
// 	height = "aspect-square",
// 	onImagesUpdated,
// 	activeImage,
// }) => {
// 	const { updateShopProductImages, getProductDetail } = useProduct();
// 	const formContext = createMode ? useFormContext() : null;

// 	const [product, setProduct] = useState<ProductDetail | null>(null);
// 	const [isLoadingProduct, setIsLoadingProduct] = useState(!createMode);

// 	const [currentIndex, setCurrentIndex] = useState(0);
// 	const [modalMode, setModalMode] = useState<ModalMode>(null);

// 	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
// 	const [previewUrls, setPreviewUrls] = useState<string[]>([]);
// 	const [imagesToDelete, setImagesToDelete] = useState<Set<string>>(new Set());
// 	const [isSubmitting, setIsSubmitting] = useState(false);

// 	const [createFiles, setCreateFiles] = useState<File[]>([]);
// 	const [createPreviewUrls, setCreatePreviewUrls] = useState<string[]>([]);

// 	const timerRef = useRef<NodeJS.Timeout | null>(null);

// 	const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

// 	// --- BỔ SUNG: Hàm xử lý khi ảnh lỗi ---
// 	const handleImageError = (url: string) => {
// 		setFailedImages((prev) => {
// 			const newSet = new Set(prev);
// 			newSet.add(url);
// 			return newSet;
// 		});
// 	};

// 	const fetchProductData = useCallback(async () => {
// 		if (createMode || !productId) {
// 			setIsLoadingProduct(false);
// 			return;
// 		}
// 		setIsLoadingProduct(true);
// 		const res = await getProductDetail(productId);
// 		if (res.success && res.data) {
// 			setProduct(res.data);
// 		}
// 		setIsLoadingProduct(false);
// 	}, [productId, getProductDetail, createMode]);

// 	useEffect(() => {
// 		fetchProductData();
// 	}, [fetchProductData]);

// 	// --- DATA AGGREGATION ---
// 	const displayImages = useMemo(() => {
// 		// 1. Trường hợp tạo mới (Giữ nguyên)
// 		if (createMode) return createPreviewUrls;

// 		// 2. Kiểm tra dữ liệu
// 		if (!product) return [];
// 		const mainImages = product.images || [];

// 		// 3. LOGIC MỚI: TÁCH RIÊNG
// 		// Nếu đang có activeImage (tức là người dùng đã chọn 1 biến thể cụ thể)
// 		if (activeImage) {
// 			// Kiểm tra xem ảnh biến thể này đã có trong danh sách ảnh gốc chưa
// 			// (Đôi khi admin up ảnh biến thể trùng với ảnh gốc)
// 			const isImageInMain = mainImages.includes(activeImage);

// 			if (!isImageInMain) {
// 				// Nếu chưa có -> Đưa ảnh biến thể lên ĐẦU TIÊN + Ảnh gốc phía sau
// 				return [activeImage, ...mainImages];
// 			}
// 			// Nếu có rồi thì thôi, hiển thị danh sách gốc (vì ảnh đó đã nằm trong đó rồi)
// 			return mainImages;
// 		}

// 		// 4. Nếu KHÔNG chọn biến thể (activeImage == null)
// 		// -> Chỉ trả về danh sách ảnh gốc của sản phẩm
// 		return mainImages;
// 	}, [product, createMode, createPreviewUrls, activeImage]);

// 	const editableImages = useMemo(() => {
// 		if (createMode) return createPreviewUrls;
// 		return product?.images || [];
// 	}, [product, createMode, createPreviewUrls]);

// 	// --- Carousel Logic ---
// 	const nextImage = useCallback(() => {
// 		setCurrentIndex((prev) => (prev + 1) % (displayImages.length || 1));
// 	}, [displayImages.length]);

// 	const prevImage = useCallback(() => {
// 		setCurrentIndex(
// 			(prev) =>
// 				(prev - 1 + (displayImages.length || 1)) % (displayImages.length || 1)
// 		);
// 	}, [displayImages.length]);

// 	useEffect(() => {
// 		if (displayImages.length > 1 && !modalMode && !activeImage) {
// 			timerRef.current = setInterval(nextImage, 5000);
// 		}
// 		return () => {
// 			if (timerRef.current) clearInterval(timerRef.current);
// 		};
// 	}, [nextImage, displayImages.length, modalMode, activeImage]);

// 	useEffect(() => {
// 		if (currentIndex >= displayImages.length && displayImages.length > 0) {
// 			setCurrentIndex(0);
// 		}
// 	}, [displayImages.length, currentIndex]);

// 	useEffect(() => {
// 		if (activeImage && displayImages.length > 0) {
// 			// Chuẩn hóa activeImage để so sánh dễ hơn
// 			const activeUrl = buildImageUrl(activeImage);

// 			const index = displayImages.findIndex((img) => {
// 				const currentUrl = buildImageUrl(img);
// 				return currentUrl === activeUrl || img === activeImage;
// 			});

// 			if (index !== -1) {
// 				setCurrentIndex(index);
// 			}
// 		}
// 	}, [activeImage, displayImages]);

// 	const handleOpenModal = (mode: ModalMode) => {
// 		setModalMode(mode);
// 		setSelectedFiles([]);
// 		setPreviewUrls([]);
// 		setImagesToDelete(new Set());
// 	};

// 	const handleCloseModal = () => {
// 		setModalMode(null);
// 		if (modalMode === "add") {
// 			previewUrls.forEach((url) => URL.revokeObjectURL(url));
// 		}
// 		setSelectedFiles([]);
// 		setPreviewUrls([]);
// 		setImagesToDelete(new Set());
// 	};

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
// 		URL.revokeObjectURL(newUrls[index]);
// 		newFiles.splice(index, 1);
// 		newUrls.splice(index, 1);
// 		setSelectedFiles(newFiles);
// 		setPreviewUrls(newUrls);
// 	};

// 	// --- SAVE ADD (ĐÃ SỬA LỖI) ---
// 	const handleSaveAdd = async () => {
// 		if (selectedFiles.length === 0) {
// 			handleCloseModal();
// 			return;
// 		}
// 		if (createMode) {
// 			const newTotalFiles = [...createFiles, ...selectedFiles];
// 			const newTotalUrls = [...createPreviewUrls, ...previewUrls];

// 			setCreateFiles(newTotalFiles);
// 			setCreatePreviewUrls(newTotalUrls);

// 			if (formContext) {
// 				formContext.setValue("images", newTotalFiles, {
// 					shouldValidate: true,
// 					shouldDirty: true,
// 				});
// 			}

// 			// Sửa lỗi tại đây: Reset thủ công, không gọi handleCloseModal
// 			setModalMode(null);
// 			setSelectedFiles([]);
// 			setPreviewUrls([]); // Url này đã được copy sang createPreviewUrls nên không revoke
// 			setImagesToDelete(new Set());
// 			return;
// 		}

// 		// UPDATE MODE
// 		setIsSubmitting(true);
// 		const formData = new FormData();
// 		selectedFiles.forEach((file) => formData.append("images", file));
// 		formData.append("mode", "add");
// 		if (productId) {
// 			const res = await updateShopProductImages(productId, formData);
// 			if (res.success) {
// 				handleCloseModal();
// 				await fetchProductData();
// 				onImagesUpdated?.();
// 			}
// 		}
// 		setIsSubmitting(false);
// 	};

// 	const toggleDeleteImage = (imgUrl: string) => {
// 		const newSet = new Set(imagesToDelete);
// 		if (newSet.has(imgUrl)) newSet.delete(imgUrl);
// 		else newSet.add(imgUrl);
// 		setImagesToDelete(newSet);
// 	};

// 	const handleSaveDelete = async () => {
// 		if (imagesToDelete.size === 0) {
// 			handleCloseModal();
// 			return;
// 		}
// 		if (createMode) {
// 			const newFiles: File[] = [];
// 			const newUrls: string[] = [];

// 			createPreviewUrls.forEach((url, index) => {
// 				if (!imagesToDelete.has(url)) {
// 					newFiles.push(createFiles[index]);
// 					newUrls.push(url);
// 				} else {
// 					URL.revokeObjectURL(url); // Xóa thật thì mới revoke
// 				}
// 			});

// 			setCreateFiles(newFiles);
// 			setCreatePreviewUrls(newUrls);

// 			if (formContext) {
// 				formContext.setValue("images", newFiles, {
// 					shouldValidate: true,
// 					shouldDirty: true,
// 				});
// 			}

// 			// Reset thủ công
// 			setModalMode(null);
// 			setImagesToDelete(new Set());
// 			return;
// 		}

// 		// UPDATE MODE
// 		setIsSubmitting(true);
// 		const keepImages = editableImages.filter((img) => !imagesToDelete.has(img));
// 		const formData = new FormData();
// 		formData.append("keepImages", JSON.stringify(keepImages));
// 		formData.append("mode", "keep");
// 		if (productId) {
// 			const res = await updateShopProductImages(productId, formData);
// 			if (res.success) {
// 				handleCloseModal();
// 				await fetchProductData();
// 				onImagesUpdated?.();
// 			}
// 		}
// 		setIsSubmitting(false);
// 	};

// 	// SỬA HÀM GET IMAGE URL AN TOÀN
// 	const getImageUrl = (src: string) => {
// 		if (!src) return null;
// 		if (src.startsWith("blob:")) return src;
// 		return buildImageUrl(src);
// 	};

// 	const currentSrcRaw = displayImages[currentIndex];
// 	const currentImageUrl =
// 		displayImages.length > 0 ? getImageUrl(currentSrcRaw) : null;

// 	// Kiểm tra xem ảnh hiện tại có bị lỗi không
// 	const isCurrentHeaderImageError =
// 		currentSrcRaw && failedImages.has(currentSrcRaw);

// 	if (isLoadingProduct) {
// 		return (
// 			<div
// 				className={clsx("bg-gray-200 animate-pulse rounded-xl", width, height)}
// 			/>
// 		);
// 	}

// 	// ... (Phần Render Modal Content & Main Render giữ nguyên như cũ của bạn) ...
// 	const renderModalContent = () => {
// 		// Paste lại phần renderModalContent cũ của bạn vào đây
// 		// ... (View, Add, Delete) ...
// 		if (modalMode === "view") {
// 			return (
// 				<div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center outline-none">
// 					<button
// 						onClick={handleCloseModal}
// 						className="absolute -top-10 right-0 z-50 p-2 text-white hover:bg-white/20 rounded-full transition-colors">
// 						<X size={32} />
// 					</button>
// 					{currentImageUrl && (
// 						<img
// 							src={currentImageUrl}
// 							alt="Gallery View"
// 							className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
// 						/>
// 					)}

// 					{displayImages.length > 1 && (
// 						<>
// 							<button
// 								onClick={(e) => {
// 									e.stopPropagation();
// 									prevImage();
// 								}}
// 								className="absolute left-0 md:-left-16 p-3 text-white hover:bg-white/20 rounded-full transition-all">
// 								<ChevronLeft size={40} />
// 							</button>
// 							<button
// 								onClick={(e) => {
// 									e.stopPropagation();
// 									nextImage();
// 								}}
// 								className="absolute right-0 md:-right-16 p-3 text-white hover:bg-white/20 rounded-full transition-all">
// 								<ChevronRight size={40} />
// 							</button>
// 						</>
// 					)}
// 					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-1 rounded-full text-white text-sm backdrop-blur-sm">
// 						{currentIndex + 1} / {displayImages.length}
// 					</div>
// 				</div>
// 			);
// 		}

// 		if (modalMode === "add") {
// 			return (
// 				<div className="relative w-full max-w-3xl mx-4 animate-in fade-in zoom-in duration-300">
// 					<button
// 						onClick={handleCloseModal}
// 						className={clsx(
// 							"absolute z-50 p-2 rounded-full text-white transition-all duration-300 shadow-lg border border-white/30 backdrop-blur-md",
// 							"top-2 right-2 bg-black/20 hover:bg-black/40 text-gray-600 md:text-white",
// 							"md:top-0 md:-right-14 md:bg-white/20 md:hover:bg-white/40 md:hover:rotate-90"
// 						)}
// 						title="Đóng">
// 						<X size={24} strokeWidth={2.5} />
// 					</button>

// 					<div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
// 						<div className="p-6 pb-2">
// 							<h3 className="font-extrabold text-2xl text-gray-800 flex items-center gap-3">
// 								<div className="p-3 bg-blue-50 rounded-xl text-blue-600">
// 									<Camera size={28} />
// 								</div>
// 								Thêm ảnh sản phẩm
// 							</h3>
// 							<p className="text-gray-500 text-sm mt-1 ml-14">
// 								Tải lên hình ảnh chất lượng cao để thu hút khách hàng.
// 							</p>
// 						</div>

// 						<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
// 							{!createMode && (
// 								<div className="mb-5 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl flex items-start gap-3 shadow-sm">
// 									{/* <div className="p-1.5 bg-white rounded-full shadow-sm text-indigo-500 mt-0.5">
// 										<Sparkles size={16} />
// 									</div> */}
// 									<div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white shrink-0">
// 										<Sparkles
// 											size={16}
// 											fill="currentColor"
// 											className="opacity-90"
// 											strokeWidth={2}
// 										/>
// 									</div>
// 									<div className="text-sm text-indigo-800/80 leading-relaxed">
// 										<span className="font-bold text-indigo-700 block mb-0.5">
// 											AI Smart Processing
// 										</span>
// 										Hãy chọn loại trang phục phù hợp khi tải ảnh mới nhé. Hệ
// 										thống sẽ dựa vào đó để sản phẩm của bạn dễ dàng đến với
// 										khách hàng hơn.
// 									</div>
// 								</div>
// 							)}

// 							<label className="group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 mb-8 relative overflow-hidden">
// 								<div className="absolute inset-0 bg-blue-100/0 group-hover:bg-blue-100/20 transition-colors" />
// 								<div className="flex flex-col items-center justify-center pt-5 pb-6 text-blue-500 z-10 transform group-hover:scale-110 transition-transform duration-300">
// 									<UploadCloud
// 										size={48}
// 										strokeWidth={1.5}
// 										className="mb-3 drop-shadow-sm"
// 									/>
// 									<p className="text-base font-semibold">Nhấn để tải ảnh lên</p>
// 									<p className="text-xs text-blue-400 mt-1 font-medium">
// 										(Hỗ trợ chọn nhiều ảnh)
// 									</p>
// 								</div>
// 								<input
// 									type="file"
// 									className="hidden"
// 									multiple
// 									accept="image/*"
// 									onChange={handleFileChange}
// 								/>
// 							</label>

// 							{previewUrls.length > 0 && (
// 								<div className="grid grid-cols-3 sm:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
// 									{previewUrls.map((url, idx) => (
// 										<div
// 											key={idx}
// 											className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-md transition-all">
// 											<img
// 												src={url}
// 												alt="preview"
// 												className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
// 											/>
// 											<button
// 												onClick={() => handleRemovePreview(idx)}
// 												className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:scale-110 transition-all shadow-md backdrop-blur-sm">
// 												<X size={14} strokeWidth={3} />
// 											</button>
// 										</div>
// 									))}
// 								</div>
// 							)}
// 						</div>

// 						<div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-4 bg-gray-50/50">
// 							<button
// 								onClick={handleCloseModal}
// 								className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md hover:bg-gray-200 hover:scale-105 transition-all duration-200">
// 								<X className="w-5 h-5" />
// 								Hủy bỏ
// 							</button>
// 							<button
// 								onClick={handleSaveAdd}
// 								disabled={isSubmitting || selectedFiles.length === 0}
// 								className="flex items-center gap-2 px-5 py-2 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-200">
// 								{isSubmitting ? (
// 									<>
// 										{" "}
// 										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
// 										Đang lưu...{" "}
// 									</>
// 								) : (
// 									<>
// 										{" "}
// 										<Check className="w-5 h-5" strokeWidth={3} />{" "}
// 										{createMode ? "Xác nhận thêm" : "Lưu ảnh"}
// 									</>
// 								)}
// 							</button>
// 						</div>
// 					</div>
// 				</div>
// 			);
// 		}

// 		if (modalMode === "delete") {
// 			return (
// 				<div className="relative w-full max-w-3xl mx-4 animate-in fade-in zoom-in duration-300">
// 					<button
// 						onClick={handleCloseModal}
// 						className={clsx(
// 							"absolute z-50 p-2 rounded-full text-white transition-all duration-300 shadow-lg border border-white/30 backdrop-blur-md",
// 							"top-2 right-2 bg-black/20 hover:bg-black/40 text-gray-600 md:text-white",
// 							"md:top-0 md:-right-14 md:bg-white/20 md:hover:bg-white/40 md:hover:rotate-90"
// 						)}
// 						title="Đóng">
// 						<X size={24} strokeWidth={2.5} />
// 					</button>

// 					<div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
// 						<div className="p-6 pb-2">
// 							<h3 className="font-extrabold text-2xl text-gray-800 flex items-center gap-3">
// 								<div className="p-3 bg-red-50 rounded-xl text-red-600">
// 									<Edit size={28} />
// 								</div>
// 								Quản lý hình ảnh
// 							</h3>
// 							<p className="text-gray-500 text-sm mt-1 ml-14">
// 								Chọn ảnh bạn muốn xóa khỏi sản phẩm.
// 							</p>
// 						</div>

// 						<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
// 							{!createMode && (
// 								<div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-start text-amber-800">
// 									<div className="mt-0.5 min-w-[20px]">
// 										<div className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs">
// 											!
// 										</div>
// 									</div>
// 									<p className="text-sm leading-relaxed">
// 										<b>Lưu ý:</b> Bạn chỉ có thể xóa <b>ảnh gốc</b> của sản phẩm
// 										tại đây. Ảnh của biến thể (màu sắc/size) cần được chỉnh sửa
// 										trong mục quản lý biến thể.
// 									</p>
// 								</div>
// 							)}

// 							<div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
// 								{editableImages.map((img, idx) => {
// 									const isSelected = imagesToDelete.has(img);
// 									const imgUrl = getImageUrl(img);
// 									return (
// 										<div
// 											key={idx}
// 											onClick={() => toggleDeleteImage(img)}
// 											className={clsx(
// 												"relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group",
// 												isSelected
// 													? "ring-4 ring-red-500 ring-offset-2 scale-95 shadow-none"
// 													: "hover:shadow-lg hover:-translate-y-1 border border-gray-100"
// 											)}>
// 											{imgUrl && (
// 												<img
// 													src={imgUrl}
// 													alt="edit"
// 													className={clsx(
// 														"w-full h-full object-cover transition-all duration-500",
// 														isSelected
// 															? "opacity-50 grayscale"
// 															: "group-hover:scale-110"
// 													)}
// 												/>
// 											)}

// 											<div
// 												className={clsx(
// 													"absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm z-10",
// 													isSelected
// 														? "bg-red-500 scale-110"
// 														: "bg-white/90 backdrop-blur-sm border border-gray-200"
// 												)}>
// 												{isSelected && (
// 													<Check
// 														size={16}
// 														strokeWidth={4}
// 														className="text-white"
// 													/>
// 												)}
// 											</div>
// 											{isSelected && (
// 												<div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-200">
// 													<div className="bg-white/90 p-3 rounded-full shadow-xl">
// 														<Trash2
// 															className="text-red-600"
// 															size={28}
// 															strokeWidth={2}
// 														/>
// 													</div>
// 												</div>
// 											)}
// 										</div>
// 									);
// 								})}
// 							</div>
// 							{editableImages.length === 0 && (
// 								<div className="flex flex-col items-center justify-center py-12 opacity-50">
// 									<Camera size={48} className="mb-2 text-gray-400" />
// 									<p className="text-gray-500 italic">
// 										Sản phẩm này chưa có ảnh chính nào.
// 									</p>
// 								</div>
// 							)}
// 						</div>

// 						<div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-4 bg-gray-50/50">
// 							<button
// 								onClick={handleCloseModal}
// 								className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md hover:bg-gray-200 hover:scale-105 transition-all duration-200">
// 								<X className="w-5 h-5" />
// 								Hủy bỏ
// 							</button>
// 							<button
// 								onClick={handleSaveDelete}
// 								disabled={isSubmitting || imagesToDelete.size === 0}
// 								className="flex items-center gap-2 px-5 py-2 text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-lg hover:from-red-600 hover:to-pink-700 hover:scale-105 transition-all duration-200">
// 								{isSubmitting ? (
// 									<>
// 										{" "}
// 										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
// 										Đang xóa...{" "}
// 									</>
// 								) : (
// 									<>
// 										{" "}
// 										<Trash2 className="w-5 h-5" strokeWidth={2} /> Xóa (
// 										{imagesToDelete.size}) ảnh{" "}
// 									</>
// 								)}
// 							</button>
// 						</div>
// 					</div>
// 				</div>
// 			);
// 		}
// 		return null;
// 	};

// 	return (
// 		<>
// 			<div
// 				className={clsx(
// 					"relative flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden group",
// 					width,
// 					height
// 				)}>
// 				<div
// 					className="w-full h-full flex items-center justify-center cursor-pointer"
// 					onClick={() => displayImages.length > 0 && handleOpenModal("view")}>
// 					{displayImages.length > 0 &&
// 					currentImageUrl &&
// 					!isCurrentHeaderImageError ? (
// 						<img
// 							src={currentImageUrl}
// 							alt="Product"
// 							className="w-full h-full object-contain transition-transform duration-500"
// 							// Khi lỗi thì gọi hàm lưu lại URL lỗi
// 							onError={() => handleImageError(currentSrcRaw)}
// 						/>
// 					) : (
// 						// --- FALLBACK: Hiển thị Icon khi không có ảnh hoặc ảnh lỗi ---
// 						<div className="flex flex-col items-center justify-center text-gray-400 select-none animate-in fade-in bg-gray-200 w-full h-full">
// 							{isCurrentHeaderImageError ? (
// 								<>
// 									<ImageOff
// 										size={48}
// 										strokeWidth={1.5}
// 										className="mb-2 opacity-50"
// 									/>
// 									<span className="text-xs font-medium uppercase tracking-wider opacity-60">
// 										Lỗi ảnh
// 									</span>
// 								</>
// 							) : (
// 								<>
// 									<Shirt
// 										size={48}
// 										strokeWidth={1.5}
// 										className="mb-2 opacity-50"
// 									/>
// 									<span className="text-xs font-medium uppercase tracking-wider opacity-60">
// 										Chưa có ảnh
// 									</span>
// 								</>
// 							)}
// 						</div>
// 					)}
// 				</div>

// 				{displayImages.length > 1 && (
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
// 						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
// 							{displayImages.map((_, idx) => (
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

// 				{(mode === "shop" || createMode) && (
// 					<div className="absolute bottom-3 left-3 flex gap-3 z-20">
// 						{editableImages.length > 0 && (
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
// 						<button
// 							onClick={(e) => {
// 								e.stopPropagation();
// 								handleOpenModal("add");
// 							}}
// 							className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform">
// 							<Camera size={18} />
// 						</button>
// 					</div>
// 				)}
// 			</div>

// 			{modalMode &&
// 				createPortal(
// 					<div
// 						className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
// 						onClick={handleCloseModal}>
// 						<div
// 							onClick={(e) => e.stopPropagation()}
// 							className="relative w-full flex justify-center">
// 							{renderModalContent()}
// 						</div>
// 					</div>,
// 					document.body
// 				)}
// 		</>
// 	);
// };
