// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
// import "react-image-crop/dist/ReactCrop.css";
// import { SearchCandidate, BoundingBox } from "./search.types";
// import clsx from "clsx";

// interface Props {
// 	imageUrl: string;
// 	candidates: SearchCandidate[];
// 	selectedBox: BoundingBox | null;
// 	onCropComplete: (blob: Blob) => void;
// 	onBoxSelect: (box: BoundingBox) => void;
// }

// export const ImageSearchCropper: React.FC<Props> = ({
// 	imageUrl,
// 	candidates,
// 	selectedBox,
// 	onCropComplete,
// 	onBoxSelect,
// }) => {
// 	const imgRef = useRef<HTMLImageElement>(null);
// 	const [crop, setCrop] = useState<Crop>();

// 	// Lưu tỉ lệ scale giữa ảnh hiển thị và ảnh gốc
// 	const [scale, setScale] = useState({ x: 1, y: 1 });
// 	const [isImageLoaded, setIsImageLoaded] = useState(false);

// 	// --- 1. UTILS: Xử lý tọa độ & Cắt ảnh ---

// 	// Convert Box [x1, y1, x2, y2] (ảnh gốc) -> PixelCrop (ảnh hiển thị)
// 	const boxToCrop = (box: BoundingBox, img: HTMLImageElement): PixelCrop => {
// 		const scaleX = img.width / img.naturalWidth;
// 		const scaleY = img.height / img.naturalHeight;
// 		const [x1, y1, x2, y2] = box;

// 		return {
// 			unit: "px",
// 			x: x1 * scaleX,
// 			y: y1 * scaleY,
// 			width: (x2 - x1) * scaleX,
// 			height: (y2 - y1) * scaleY,
// 		};
// 	};

// 	// Cắt ảnh ra Blob để gửi API
// 	const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop) => {
// 		const canvas = document.createElement("canvas");
// 		const scaleX = image.naturalWidth / image.width;
// 		const scaleY = image.naturalHeight / image.height;

// 		canvas.width = crop.width * scaleX;
// 		canvas.height = crop.height * scaleY;
// 		const ctx = canvas.getContext("2d");

// 		if (!ctx) return null;

// 		ctx.drawImage(
// 			image,
// 			crop.x * scaleX,
// 			crop.y * scaleY,
// 			crop.width * scaleX,
// 			crop.height * scaleY,
// 			0,
// 			0,
// 			crop.width * scaleX,
// 			crop.height * scaleY
// 		);

// 		return new Promise<Blob>((resolve) => {
// 			canvas.toBlob(
// 				(blob) => {
// 					if (blob) resolve(blob);
// 				},
// 				"image/jpeg",
// 				0.95
// 			);
// 		});
// 	};

// 	// --- 2. EFFECTS ---

// 	// Khi ảnh load xong
// 	const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
// 		const img = e.currentTarget;
// 		setScale({
// 			x: img.width / img.naturalWidth,
// 			y: img.height / img.naturalHeight,
// 		});
// 		setIsImageLoaded(true);

// 		// Nếu có box được chọn sẵn (thường là box đầu tiên), apply crop ngay
// 		if (selectedBox) {
// 			const initialCrop = boxToCrop(selectedBox, img);
// 			setCrop(initialCrop);
// 			// Trigger search lần đầu ngay lập tức
// 			handleCropComplete(initialCrop, img);
// 		} else {
// 			// Nếu không có box nào -> Crop full ảnh
// 			const fullCrop: PixelCrop = {
// 				unit: "px",
// 				x: 0,
// 				y: 0,
// 				width: img.width,
// 				height: img.height,
// 			};
// 			setCrop(fullCrop);
// 			handleCropComplete(fullCrop, img);
// 		}
// 	};

// 	// Khi selectedBox thay đổi từ bên ngoài (VD: user chọn box từ list)
// 	useEffect(() => {
// 		if (selectedBox && imgRef.current && isImageLoaded) {
// 			const newCrop = boxToCrop(selectedBox, imgRef.current);
// 			setCrop(newCrop);
// 			// Gọi search ngay khi chọn box
// 			handleCropComplete(newCrop, imgRef.current);
// 		}
// 	}, [selectedBox, isImageLoaded]);

// 	// --- 3. HANDLERS ---

// 	const handleCropComplete = async (
// 		c: PixelCrop,
// 		imgElement?: HTMLImageElement
// 	) => {
// 		const img = imgElement || imgRef.current;
// 		if (img && c.width > 0 && c.height > 0) {
// 			const blob = await getCroppedImg(img, c);
// 			if (blob) {
// 				onCropComplete(blob);
// 			}
// 		}
// 	};

// 	return (
// 		<div className="flex flex-col gap-4">
// 			{/* VÙNG 1: CROPPER & OVERLAY */}
// 			<div className="relative w-full bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden border border-gray-200">
// 				<ReactCrop
// 					crop={crop}
// 					onChange={(_, percentCrop) => setCrop(percentCrop)}
// 					onComplete={(c) => handleCropComplete(c)}
// 					// ruleOfThirds // Hiện lưới quy tắc 1/3 cho pro
// 					className="max-h-[500px]">
// 					<img
// 						ref={imgRef}
// 						src={imageUrl}
// 						alt="Search Target"
// 						onLoad={onImageLoad}
// 						className="max-h-[500px] w-auto object-contain block"
// 						crossOrigin="anonymous" // Quan trọng nếu ảnh từ domain khác
// 					/>

// 					{/* OVERLAY: Vẽ các box gợi ý khác (Mờ mờ bên dưới) */}
// 					{isImageLoaded &&
// 						candidates.map((cand, idx) => {
// 							// Chỉ vẽ những box KHÔNG phải là box đang chọn
// 							// (Hoặc vẽ tất cả để user biết chỗ bấm)
// 							const isActive = selectedBox === cand.box;
// 							const [x1, y1, x2, y2] = cand.box;

// 							return (
// 								<div
// 									key={idx}
// 									onClick={(e) => {
// 										e.stopPropagation(); // Ngăn ReactCrop bắt sự kiện
// 										e.preventDefault();
// 										onBoxSelect(cand.box);
// 									}}
// 									className={clsx(
// 										"absolute border-2 cursor-pointer z-10 transition-all hover:bg-white/20",
// 										isActive
// 											? "border-transparent hidden"
// 											: "border-white/70 border-dashed"
// 									)}
// 									style={{
// 										left: x1 * scale.x,
// 										top: y1 * scale.y,
// 										width: (x2 - x1) * scale.x,
// 										height: (y2 - y1) * scale.y,
// 									}}
// 									title={`Chọn vùng: ${cand.label}`}>
// 									{/* Label nhỏ hiện trên box */}
// 									<span className="absolute -top-5 left-0 text-[10px] bg-black/50 text-white px-1 rounded">
// 										{cand.label}
// 									</span>
// 								</div>
// 							);
// 						})}
// 				</ReactCrop>
// 			</div>

// 			{/* VÙNG 2: DANH SÁCH GỢI Ý NHANH (Giống Shopee) */}
// 			{candidates.length > 0 && (
// 				<div className="flex flex-wrap gap-2">
// 					<span className="text-sm font-medium text-gray-600 py-1">
// 						Vùng nhận diện:
// 					</span>
// 					{candidates.map((cand, index) => {
// 						const isSelected = selectedBox === cand.box;
// 						return (
// 							<button
// 								key={index}
// 								onClick={() => onBoxSelect(cand.box)}
// 								className={clsx(
// 									"px-3 py-1 text-sm rounded-full border transition-colors",
// 									isSelected
// 										? "bg-blue-600 text-white border-blue-600"
// 										: "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-500"
// 								)}>
// 								{cand.label === "upper_body"
// 									? "Áo"
// 									: cand.label === "lower_body"
// 									? "Quần"
// 									: cand.label === "full_body"
// 									? "Toàn thân"
// 									: "Vật thể"}{" "}
// 								#{index + 1}
// 							</button>
// 						);
// 					})}
// 				</div>
// 			)}
// 		</div>
// 	);
// };
"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { SearchCandidate, BoundingBox } from "./search.types";
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
	const [crop, setCrop] = useState<Crop>();

	// Lưu tỉ lệ scale giữa ảnh hiển thị và ảnh gốc
	const [scale, setScale] = useState({ x: 1, y: 1 });
	const [isImageLoaded, setIsImageLoaded] = useState(false);

	// --- STATE MỚI: Theo dõi box đang được Hover ---
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

		if (selectedBox) {
			const initialCrop = boxToCrop(selectedBox, img);
			setCrop(initialCrop);
			handleCropComplete(initialCrop, img);
		} else {
			const fullCrop: PixelCrop = {
				unit: "px",
				x: 0,
				y: 0,
				width: img.width,
				height: img.height,
			};
			setCrop(fullCrop);
			handleCropComplete(fullCrop, img);
		}
	};

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
		if (img && c.width > 0 && c.height > 0) {
			const blob = await getCroppedImg(img, c);
			if (blob) {
				onCropComplete(blob);
			}
		}
	};

	return (
		<div className="flex flex-col gap-4">
			{/* VÙNG 1: CROPPER & OVERLAY */}
			<div className="relative w-full bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden border border-gray-200">
				<ReactCrop
					crop={crop}
					onChange={(_, percentCrop) => setCrop(percentCrop)}
					onComplete={(c) => handleCropComplete(c)}
					className="max-h-[500px]">
					<img
						ref={imgRef}
						src={imageUrl}
						alt="Search Target"
						onLoad={onImageLoad}
						className="max-h-[500px] w-auto object-contain block"
						crossOrigin="anonymous"
					/>

					{/* OVERLAY: Chỉ vẽ box khi người dùng Hover vào nút bên dưới */}
					{isImageLoaded &&
						hoveredBox &&
						(() => {
							const [x1, y1, x2, y2] = hoveredBox;
							// Nếu box đang hover trùng với box đang chọn thì không cần vẽ đè
							if (hoveredBox === selectedBox) return null;

							return (
								<div
									className="absolute border-2 border-white/80 border-dashed bg-black/10 z-10 pointer-events-none transition-all duration-200"
									style={{
										left: x1 * scale.x,
										top: y1 * scale.y,
										width: (x2 - x1) * scale.x,
										height: (y2 - y1) * scale.y,
									}}
								/>
							);
						})()}
				</ReactCrop>
			</div>

			{/* VÙNG 2: DANH SÁCH GỢI Ý NHANH (Hover vào nút -> Vẽ box lên hình) */}
			{candidates.length > 0 && (
				<div className="flex flex-wrap gap-2">
					<span className="text-sm font-medium text-gray-600 py-1">
						Vùng nhận diện:
					</span>
					{candidates.map((cand, index) => {
						const isSelected = selectedBox === cand.box;
						return (
							<button
								key={index}
								onClick={() => onBoxSelect(cand.box)}
								// SỰ KIỆN HOVER
								onMouseEnter={() => setHoveredBox(cand.box)}
								onMouseLeave={() => setHoveredBox(null)}
								className={clsx(
									"px-3 py-1 text-sm rounded-full border transition-colors",
									isSelected
										? "bg-blue-600 text-white border-blue-600"
										: "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-500"
								)}>
								{cand.label === "upper_body"
									? "Áo"
									: cand.label === "lower_body"
									? "Quần"
									: cand.label === "full_body"
									? "Toàn thân"
									: "Vật thể"}{" "}
								#{index + 1}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};
