"use client";

import React, { useState, useCallback, useEffect } from "react";
import { UploadCloud, X, Check, Camera, ZoomIn } from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@shared/core/utils";
import { ImagePreviewModal } from "@shared/core/components/ui";
import clsx from "clsx";

interface Props {
	label: string;
	onFileCropped: (file: File | null) => void;
	aspectRatio?: number; // 1 cho logo (vuông), 16/9 cho ảnh bìa
	initialPreview?: string | null;
}

export const ImageUploaderWithCrop: React.FC<Props> = ({
	label,
	onFileCropped,
	aspectRatio = 1,
	initialPreview = null,
}) => {
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [preview, setPreview] = useState<string | null>(initialPreview);
	const [showCropModal, setShowCropModal] = useState(false);
	const [showPreviewModal, setShowPreviewModal] = useState(false);

	// Crop state
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

	// Dọn dẹp memory leak
	useEffect(() => {
		return () => {
			if (imageSrc) URL.revokeObjectURL(imageSrc);
			if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
		};
	}, [imageSrc, preview]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const objectUrl = URL.createObjectURL(file);
			setImageSrc(objectUrl);
			setShowCropModal(true);
			e.target.value = ""; // Reset input để có thể chọn lại cùng 1 file
		}
	};

	const onCropComplete = useCallback((_: any, croppedPixels: any) => {
		setCroppedAreaPixels(croppedPixels);
	}, []);

	const handleCropSave = async () => {
		if (imageSrc && croppedAreaPixels) {
			try {
				const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
				const file = new File([croppedBlob], "cropped_image.jpg", {
					type: "image/jpeg",
				});

				const croppedUrl = URL.createObjectURL(file);
				setPreview(croppedUrl);
				onFileCropped(file); // Trả file về cho form cha

				setShowCropModal(false);
				URL.revokeObjectURL(imageSrc);
				setImageSrc(null);
			} catch (error) {
				console.error("Lỗi khi cắt ảnh:", error);
			}
		}
	};

	const handleCropCancel = () => {
		setShowCropModal(false);
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(null);
	};

	const inputId = `uploader-${label.replace(/\s+/g, "-").toLowerCase()}`;

	return (
		<div className="space-y-2">
			<label className="font-medium text-gray-700">{label}</label>
			<div
				className={clsx(
					"relative w-full border-2 border-dashed rounded-lg group transition",
					"border-gray-300 bg-gray-50 hover:border-primary"
				)}
				style={{ aspectRatio: `${aspectRatio}` }}>
				<div className="absolute inset-0 flex items-center justify-center">
					{preview ? (
						<>
							<img
								src={preview}
								alt="Preview"
								className="w-full h-full object-cover rounded-lg"
							/>
							<div
								onClick={() => setShowPreviewModal(true)}
								className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer rounded-lg">
								<ZoomIn className="w-8 h-8 text-white" />
							</div>
						</>
					) : (
						<div className="text-center text-gray-500">
							<UploadCloud size={40} strokeWidth={1.5} className="mx-auto" />
							<p className="mt-2 text-sm">Nhấn nút để tải ảnh lên</p>
						</div>
					)}
				</div>
				<label
					htmlFor={inputId}
					className="absolute bottom-2 right-2 bg-white p-2 rounded-full cursor-pointer shadow-md hover:bg-gray-100 transition">
					<Camera className="w-5 h-5 text-gray-600" />
				</label>
				<input
					id={inputId}
					type="file"
					className="hidden"
					accept="image/*"
					onChange={handleFileChange}
				/>
			</div>

			{/* Crop Modal */}
			{showCropModal && imageSrc && (
				<div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[10000]">
					<div className="bg-white p-4 rounded-lg relative w-[90vw] max-w-[600px] h-[70vh] flex flex-col">
						<h2 className="text-xl font-bold text-center mb-4 text-gray-800">
							Cắt ảnh
						</h2>
						<div className="flex-1 relative">
							<Cropper
								image={imageSrc}
								crop={crop}
								zoom={zoom}
								aspect={aspectRatio}
								cropShape={aspectRatio === 1 ? "round" : "rect"}
								onCropChange={setCrop}
								onZoomChange={setZoom}
								onCropComplete={onCropComplete}
							/>
						</div>
						<div className="mt-4 flex justify-center gap-4">
							<button
								onClick={handleCropCancel}
								className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
								<X size={18} /> Hủy
							</button>
							<button
								onClick={handleCropSave}
								className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
								<Check size={18} /> Lưu
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Image Preview Modal */}
			<ImagePreviewModal
				imageUrl={preview || ""}
				open={showPreviewModal}
				onClose={() => setShowPreviewModal(false)}
			/>
		</div>
	);
};
