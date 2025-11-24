"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactCrop, {
	Crop,
	PixelCrop,
	centerCrop,
	makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
	SearchCandidate,
	BoundingBox,
} from "@shared/features/search/search.types";

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
	const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

	// Helper: Chuyển BoundingBox [x1, y1, x2, y2] -> PixelCrop {x, y, width, height}
	// Cần biết tỉ lệ ảnh hiển thị so với ảnh gốc
	const boxToCrop = (box: BoundingBox, img: HTMLImageElement): PixelCrop => {
		const [x1, y1, x2, y2] = box;

		// Ảnh hiển thị có thể bị scale (object-contain), cần tính ratio
		const scaleX = img.width / img.naturalWidth;
		const scaleY = img.height / img.naturalHeight;

		return {
			unit: "px",
			x: x1 * scaleX,
			y: y1 * scaleY,
			width: (x2 - x1) * scaleX,
			height: (y2 - y1) * scaleY,
		};
	};

	// Khi selectedBox thay đổi (từ hook), cập nhật vùng crop hiển thị
	useEffect(() => {
		if (selectedBox && imgRef.current) {
			const newCrop = boxToCrop(selectedBox, imgRef.current);
			setCrop(newCrop);
			setCompletedCrop(newCrop); // Trigger search ngay nếu muốn
		}
	}, [selectedBox]);

	// Hàm cắt ảnh thật sự (Canvas) -> Blob
	const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop) => {
		const canvas = document.createElement("canvas");
		const scaleX = image.naturalWidth / image.width;
		const scaleY = image.naturalHeight / image.height;

		canvas.width = crop.width * scaleX;
		canvas.height = crop.height * scaleY;
		const ctx = canvas.getContext("2d");

		if (!ctx) return;

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

	// Khi người dùng thả tay sau khi crop
	const handleCropComplete = async (c: PixelCrop) => {
		if (imgRef.current && c.width && c.height) {
			const blob = await getCroppedImg(imgRef.current, c);
			if (blob) onCropComplete(blob);
		}
	};

	return (
		<div className="relative w-full h-[400px] bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
			<ReactCrop
				crop={crop}
				onChange={(_, percentCrop) => setCrop(percentCrop)}
				onComplete={(c) => handleCropComplete(c)}
				className="max-h-full">
				<img
					ref={imgRef}
					src={imageUrl}
					alt="Search"
					className="max-h-[400px] w-auto object-contain"
					onLoad={(e) => {
						// Load xong thì set crop mặc định nếu chưa có
						const img = e.currentTarget;
						if (selectedBox) {
							setCrop(boxToCrop(selectedBox, img));
						} else {
							// Full ảnh
							setCrop({ unit: "%", width: 100, height: 100, x: 0, y: 0 });
						}
					}}
				/>

				{/* Vẽ các Box gợi ý đè lên ảnh (Overlay) */}
				{/* Logic này hơi phức tạp với ReactCrop vì nó chặn sự kiện click */}
				{/* Giải pháp: Vẽ các nút bấm bên dưới ảnh hoặc bên cạnh để user chọn box */}
			</ReactCrop>
		</div>
	);
};
