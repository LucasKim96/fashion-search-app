"use client";

import React, { useState, useEffect } from "react";
import { Shirt, ImageOff } from "lucide-react"; // Hoặc icon bạn thích
import clsx from "clsx";
import { buildImageUrl } from "@shared/core/utils"; // Hàm build url của bạn

interface ImageWithFallbackProps
	extends React.ImgHTMLAttributes<HTMLImageElement> {
	src: string;
	alt: string;
	fallbackClassName?: string; // Class cho khung chứa icon fallback
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
	src,
	alt,
	className,
	fallbackClassName,
	...props
}) => {
	const [error, setError] = useState(false);

	// Reset lỗi khi src thay đổi (quan trọng khi tái sử dụng component)
	useEffect(() => {
		setError(false);
	}, [src]);

	const imageUrl = buildImageUrl(src);

	if (!imageUrl || error) {
		return (
			<div
				className={clsx(
					"flex items-center justify-center bg-gray-100 text-gray-400 h-full w-full",
					className, // Giữ lại class kích thước từ cha
					fallbackClassName
				)}>
				<Shirt strokeWidth={1.5} className="opacity-50 w-1/2 h-1/2" />
			</div>
		);
	}

	return (
		<img
			src={imageUrl}
			alt={alt}
			className={className}
			onError={() => setError(true)}
			{...props}
		/>
	);
};
