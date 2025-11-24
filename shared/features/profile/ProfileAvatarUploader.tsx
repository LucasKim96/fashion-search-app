"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Camera, X, Check, ZoomIn, Crop, Focus } from "lucide-react";
import { useUser } from "@shared/features/user";
import { UserProfile, getCroppedImg } from "@shared/core/utils";
import { ImagePreviewModal } from "@shared/core/components/ui";
import Cropper from "react-easy-crop";

interface Props {
	profile: UserProfile;
	size?: number;
	onUpdate?: () => void;
}

export const ProfileAvatarUploader: React.FC<Props> = ({
	profile,
	size = 120,
	onUpdate,
}) => {
	const { updateAvatar } = useUser();
	const [preview, setPreview] = useState<string>(profile.avatarUrl || "");
	const [showCrop, setShowCrop] = useState(false);
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [showPreviewModal, setShowPreviewModal] = useState(false);

	// crop state
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

	useEffect(() => {
		setPreview(profile.avatarUrl || "");
	}, [profile.avatarUrl]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const objectUrl = URL.createObjectURL(file);
			setImageSrc(objectUrl);
			setShowCrop(true);
		}
	};

	const onCropComplete = useCallback((_: any, croppedPixels: any) => {
		setCroppedAreaPixels(croppedPixels);
	}, []);

	const handleCropSave = async () => {
		if (imageSrc && profile.userId && croppedAreaPixels) {
			const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
			const file = new File([croppedBlob], "avatar.jpg", {
				type: "image/jpeg",
				lastModified: Date.now(),
			});

			const croppedUrl = URL.createObjectURL(file);
			setPreview(croppedUrl);
			setShowCrop(false);

			const res = await updateAvatar(profile.userId, file);
			if (res.success && onUpdate) {
				setTimeout(() => {
					onUpdate();
				}, 2);
				// onUpdate();
			}
			// await updateAvatar(profile.userId, file);
		}
	};

	const handleCropCancel = () => {
		setShowCrop(false);
		setImageSrc(null);
	};

	return (
		<div className="relative w-fit">
			{/* Avatar hình tròn */}
			<div
				className="group relative cursor-pointer overflow-hidden rounded-full shadow-xl transition-all duration-300"
				style={{ width: size, height: size }}
				onClick={() => setShowPreviewModal(true)}>
				{/* Ảnh avatar */}
				<img
					src={preview || "/default-avatar.png"}
					alt="Avatar"
					className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 group-hover:brightness-110"
				/>

				{/* Viền trắng mờ sang trọng */}
				<div className="absolute inset-0 rounded-full ring-2 ring-white/80 pointer-events-none" />

				{/* Hiệu ứng overlay khi hover */}
				<div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 backdrop-blur-[1px] transition-all duration-500 flex items-center justify-center">
					<div className="bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/30 shadow-inner scale-90 group-hover:scale-100 transition-all duration-300">
						<Focus className="w-6 h-6 text-white drop-shadow-md" />
					</div>
				</div>
			</div>

			{/* Icon chỉnh sửa - tách biệt click */}
			<label className="absolute bottom-1 right-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-2 rounded-full cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110">
				<Camera className="w-5 h-5" />
				<input
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleChange}
				/>
			</label>

			{/* Crop Modal */}
			{showCrop && imageSrc && (
				<div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 pt-20">
					{/* Wrapper ngoài cho modal + title + cropper + buttons */}
					<div className="bg-white p-4 rounded-lg relative w-[600px] h-[600px] flex flex-col">
						{/* Title */}
						<div className="flex items-center justify-center mb-4">
							{/* Optional Icon */}
							<div className="mr-2">
								<Crop className="w-7 h-7 text-blue-500 animate-bounce" />
							</div>

							{/* Title */}
							<h2 className="text-2xl md:text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 drop-shadow-lg">
								CẮT ẢNH ĐẠI DIỆN
							</h2>
						</div>

						{/* Cropper Container - Must be flex-1 to take up remaining space. */}
						<div className="flex-1 relative">
							<Cropper
								image={imageSrc}
								crop={crop}
								zoom={zoom}
								aspect={1}
								cropShape="round"
								showGrid={false}
								onCropChange={setCrop}
								onZoomChange={setZoom}
								onCropComplete={onCropComplete}
							/>
						</div>

						{/* Controls */}
						<div className="mt-6 flex justify-center gap-6">
							{/* Cancel Button */}
							<button
								onClick={handleCropCancel}
								className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-full shadow-md hover:bg-gray-200 hover:scale-105 transition-all duration-200">
								<X className="w-5 h-5" />
								Hủy
							</button>

							{/* Save Button */}
							<button
								onClick={handleCropSave}
								className="flex items-center gap-2 px-5 py-2 text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-200">
								<Check className="w-5 h-5" />
								Lưu
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Hiển thị ảnh */}
			<ImagePreviewModal
				imageUrl={preview || "/default-avatar.png"} // dùng preview hoặc fallback
				alt="Avatar"
				open={showPreviewModal}
				onClose={() => setShowPreviewModal(false)}
			/>
		</div>
	);
};
