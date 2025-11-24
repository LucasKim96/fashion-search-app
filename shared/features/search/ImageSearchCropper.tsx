"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { SearchCandidate, BoundingBox } from "./search.types";
import { ScanEye, Shirt, Footprints, User, Box } from "lucide-react";
import clsx from "clsx";

interface Props {
	imageUrl: string;
	candidates: SearchCandidate[];
	selectedBox: BoundingBox | null;
	onCropComplete: (blob: Blob) => void;
	onBoxSelect: (box: BoundingBox) => void;
}

export const ImageSearchCropper: React.FC<Props> = ({
	imageUrl,
	candidates,
	selectedBox,
	onCropComplete,
	onBoxSelect,
}) => {
	const imgRef = useRef<HTMLImageElement>(null);
	// Khởi tạo crop state
	const [crop, setCrop] = useState<Crop>();

	// Lưu tỉ lệ scale giữa ảnh hiển thị và ảnh gốc
	const [scale, setScale] = useState({ x: 1, y: 1 });
	const [isImageLoaded, setIsImageLoaded] = useState(false);

	// State theo dõi box đang hover
	const [hoveredBox, setHoveredBox] = useState<BoundingBox | null>(null);

	// --- 1. UTILS ---
	const boxToCrop = (box: BoundingBox, img: HTMLImageElement): PixelCrop => {
		const scaleX = img.width / img.naturalWidth;
		const scaleY = img.height / img.naturalHeight;
		const [x1, y1, x2, y2] = box;

		return {
			unit: "px",
			x: x1 * scaleX,
			y: y1 * scaleY,
			width: (x2 - x1) * scaleX,
			height: (y2 - y1) * scaleY,
		};
	};

	const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop) => {
		const canvas = document.createElement("canvas");
		const scaleX = image.naturalWidth / image.width;
		const scaleY = image.naturalHeight / image.height;

		canvas.width = crop.width * scaleX;
		canvas.height = crop.height * scaleY;
		const ctx = canvas.getContext("2d");

		if (!ctx) return null;

		ctx.drawImage(
			image,
			crop.x * scaleX,
			crop.y * scaleY,
			crop.width * scaleX,
			crop.height * scaleY,
			0,
			0,
			crop.width * scaleX,
			crop.height * scaleY
		);

		return new Promise<Blob>((resolve) => {
			canvas.toBlob(
				(blob) => {
					if (blob) resolve(blob);
				},
				"image/jpeg",
				0.95
			);
		});
	};

	// --- 2. EFFECTS ---
	const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const img = e.currentTarget;
		setScale({
			x: img.width / img.naturalWidth,
			y: img.height / img.naturalHeight,
		});
		setIsImageLoaded(true);

		// LOGIC MỚI: Khởi tạo crop ban đầu
		if (selectedBox) {
			// 1. Nếu có box được chọn từ candidates -> Crop theo box đó
			const initialCrop = boxToCrop(selectedBox, img);
			setCrop(initialCrop);
			handleCropComplete(initialCrop, img);
		} else {
			// 2. Nếu KHÔNG có candidates nào -> Tạo khung mặc định Ở GIỮA (80% ảnh)
			// Để người dùng tự chỉnh sửa
			const width = img.width * 0.8;
			const height = img.height * 0.8;
			const x = (img.width - width) / 2;
			const y = (img.height - height) / 2;

			const defaultCrop: PixelCrop = {
				unit: "px",
				x,
				y,
				width,
				height,
			};
			setCrop(defaultCrop);
			handleCropComplete(defaultCrop, img);
		}
	};

	// Khi selectedBox thay đổi (do user bấm nút bên dưới) -> Cập nhật crop
	useEffect(() => {
		if (selectedBox && imgRef.current && isImageLoaded) {
			const newCrop = boxToCrop(selectedBox, imgRef.current);
			setCrop(newCrop);
			handleCropComplete(newCrop, imgRef.current);
		}
	}, [selectedBox, isImageLoaded]);

	// --- 3. HANDLERS ---
	const handleCropComplete = async (
		c: PixelCrop,
		imgElement?: HTMLImageElement
	) => {
		const img = imgElement || imgRef.current;
		// Thêm điều kiện check width/height > 0 để tránh lỗi khi crop quá nhỏ
		if (img && c.width > 5 && c.height > 5) {
			const blob = await getCroppedImg(img, c);
			if (blob) {
				onCropComplete(blob);
			}
		}
	};
	// --- HELPER ICON ---
	const getIcon = (label: string) => {
		switch (label) {
			case "upper_body":
				return <Shirt size={18} />;
			case "lower_body":
				return <Footprints size={18} />;
			case "full_body":
				return <User size={18} />;
			default:
				return <Box size={18} />;
		}
	};

	const getLabelVN = (label: string) => {
		switch (label) {
			case "upper_body":
				return "Áo";
			case "lower_body":
				return "Quần/Váy";
			case "full_body":
				return "Toàn thân";
			default:
				return "Vật thể";
		}
	};

	return (
		<div className="flex flex-col gap-6 justify-center items-center w-full">
			{/* CSS Override: Chuyển từ Cyan sang Indigo/Violet */}
			{/* CSS Override: Clean AI Style */}
			<style
				dangerouslySetInnerHTML={{
					__html: `
				/* 1. KHUNG CROP CHÍNH (Selection) */
				.ai-cropper .ReactCrop__crop-selection {
					border-image: none !important; 
					background-image: none !important; /* QUAN TRỌNG: Tắt nét đứt do background tạo ra */
					animation: none !important;        /* QUAN TRỌNG: Tắt chuyển động */
					
					/* Thiết lập viền liền màu trắng */
					border: 2px solid #ffffff !important; 
					border-radius: 5px !important;
				}

                /* 2. ẨN NÚT KÉO (HANDLES) NHƯNG VẪN CHỈNH ĐƯỢC */
				.ai-cropper .ReactCrop__drag-handle {
                    /* Làm trong suốt hoàn toàn */
                    background: transparent !important;
					border: none !important; 
                    box-shadow: none !important;
					width: 30px !important; /* Tăng diện tích bấm để dễ kéo góc */
                    height: 30px !important; 
                    transform: translate(-50%, -50%);
                    margin-top: 0; margin-left: 0; 
				}
                
                /* Đảm bảo vẫn hiện con trỏ chuột đúng hướng khi rê vào góc */
                .ai-cropper .ReactCrop__drag-handle::after {
                    display: none !important;
                }
			`,
				}}
			/>

			{/* VÙNG 1: CROPPER CONTAINER */}
			<div className="relative w-[80%] rounded-2xl shadow-[inset_0_0_12px_rgba(0,0,0,0.12)] overflow-hidden group cursor-default ai-cropper">
				{/* Background Grid Pattern: Màu sáng rất mờ trên nền tối tạo chiều sâu */}
				{/* <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div> */}

				<div className="flex items-center justify-center py-6 relative z-10">
					<ReactCrop
						crop={crop}
						onChange={(_, percentCrop) => setCrop(percentCrop)}
						onComplete={(c) => handleCropComplete(c)}
						keepSelection={true}
						minWidth={50}
						minHeight={50}
						style={{ cursor: "default" }}
						className="max-h-[500px] rounded-2xl max-w-full ">
						<img
							ref={imgRef}
							src={imageUrl}
							alt="Search Target"
							onLoad={onImageLoad}
							className="max-h-full w-auto object-contain block select-none"
							crossOrigin="anonymous"
							onDragStart={(e) => e.preventDefault()}
						/>

						{/* PREVIEW BOX: Màu AMBER (Vàng cam) hiện đại */}
						{isImageLoaded &&
							hoveredBox &&
							imgRef.current &&
							(() => {
								const [x1, y1, x2, y2] = hoveredBox;
								if (hoveredBox === selectedBox) return null;

								const natW = imgRef.current.naturalWidth;
								const natH = imgRef.current.naturalHeight;

								const left = (x1 / natW) * 100 + "%";
								const top = (y1 / natH) * 100 + "%";
								const width = ((x2 - x1) / natW) * 100 + "%";
								const height = ((y2 - y1) / natH) * 100 + "%";

								return (
									<div
										className="absolute border-2 border-amber-400 border-dashed z-20 pointer-events-none transition-all duration-200 bg-amber-400/5"
										style={{ left, top, width, height }}>
										{/* Label Preview đẹp hơn */}
										<div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
											<div className="bg-amber-400 text-slate-900 text-[10px] px-3 py-1 rounded shadow-lg font-bold uppercase tracking-wide">
												Preview
											</div>
											{/* Mũi tên trỏ xuống */}
											<div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-amber-400"></div>
										</div>
									</div>
								);
							})()}
					</ReactCrop>
				</div>
			</div>

			{/* VÙNG 2: CONTROL PANEL - Clean & Modern Chips */}
			{candidates.length > 0 && (
				<div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500  justify-center items-center">
					<div className="flex items-center gap-2 text-slate-700 px-1">
						<div className="p-1.5 bg-indigo-50 rounded-md text-indigo-600">
							<ScanEye size={20} />
						</div>
						<span className="text-lg font-bold text-indigo-600 uppercase">
							Vùng nhận diện{" "}
							<span className="text-indigo-400 font-normal ml-1">
								({candidates.length})
							</span>
						</span>
					</div>

					<div className="flex flex-wrap gap-3">
						{candidates.map((cand, index) => {
							const isSelected = selectedBox === cand.box;
							return (
								<button
									key={index}
									onClick={() => onBoxSelect(cand.box)}
									onMouseEnter={() => setHoveredBox(cand.box)}
									onMouseLeave={() => setHoveredBox(null)}
									className={clsx(
										"group relative flex items-center gap-2 px-4 py-2 rounded-full text-base font-medium transition-all duration-300 border",
										isSelected
											? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/25 scale-[1.02]"
											: "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 hover:shadow-sm"
									)}>
									{/* Icon */}
									<span
										className={clsx(
											"transition-colors",
											isSelected
												? "text-blue-100"
												: "text-slate-400 group-hover:text-indigo-500"
										)}>
										{getIcon(cand.label)}
									</span>

									{/* Text */}
									<span>
										{getLabelVN(cand.label)}
										<span
											className={clsx(
												"text-xs ml-1.5 font-mono",
												isSelected
													? "text-indigo-200 opacity-80"
													: "text-slate-300"
											)}></span>
									</span>

									{/* Active Indicator: Glow nhẹ thay vì chấm đỏ */}
									{isSelected && (
										<span className="absolute inset-0 rounded-full ring-2 ring-indigo-500/20 ring-offset-1 pointer-events-none"></span>
									)}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};
