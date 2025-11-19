"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

interface ProductDetailLayoutProps {
	// --- Chế độ hiển thị ---
	isModal?: boolean; // True: hiện Modal popup, False: hiện Inline bình thường
	isOpen?: boolean; // Chỉ dùng khi isModal = true
	onClose?: () => void; // Hàm đóng modal

	// --- Nội dung các phần ---
	imageContent: React.ReactNode; // Div 1: Ảnh
	imageWidth?: string; // Tùy chỉnh width ảnh (VD: "w-1/3", "w-[300px]", "md:w-96")

	headerContent: React.ReactNode; // Div 2: Thông tin ngang ảnh
	detailContent: React.ReactNode; // Div 3: Thông tin chi tiết bên dưới
	footerContent?: React.ReactNode; // Div 4: Option (nếu có thì hiện HR + nội dung)

	// --- Style tùy chỉnh ---
	className?: string; // Class cho container chính
}

export const ProductDetailLayout: React.FC<ProductDetailLayoutProps> = ({
	isModal = false,
	isOpen = false,
	onClose,
	imageContent,
	imageWidth = "w-full md:w-1/3", // Mặc định chiếm 1/3 trên desktop
	headerContent,
	detailContent,
	footerContent,
	className,
}) => {
	const [mounted, setMounted] = useState(false);

	// Fix lỗi hydration khi dùng Portal trong Next.js
	useEffect(() => {
		setMounted(true);

		// Khóa scroll body khi mở modal
		if (isModal && isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isModal, isOpen]);

	// Nội dung chính (Layout 4 phần)
	const MainContent = (
		<div
			className={clsx(
				"bg-white p-6 rounded-2xl shadow-sm", // Style nền trắng
				isModal
					? "shadow-2xl w-full max-w-5xl mx-4 relative animate-in fade-in zoom-in duration-300"
					: "border border-gray-200", // Style riêng cho modal vs inline
				className
			)}
			onClick={(e) => e.stopPropagation()} // Chặn click xuyên qua modal đóng popup
		>
			{/* Nút Close Tròn nằm bên ngoài Modal (Góc trên phải) */}
			{isModal && (
				<button
					onClick={onClose}
					className="absolute -top-12 right-0 md:-right-12 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 hover:rotate-90 transition-all duration-300 backdrop-blur-md shadow-lg border border-white/30"
					title="Đóng">
					<X size={24} strokeWidth={2.5} />
				</button>
			)}

			{/* Hàng trên: Div 1 (Ảnh) + Div 2 (Header Info) */}
			<div className="flex flex-col md:flex-row gap-6">
				{/* DIV 1: Ảnh (Góc trái) */}
				<div className={clsx("flex-shrink-0", imageWidth)}>{imageContent}</div>

				{/* DIV 2: Info (Phần còn lại) */}
				<div className="flex-1 min-w-0">{headerContent}</div>
			</div>

			{/* DIV 3: Chi tiết (Bên dưới) */}
			<div className="mt-6">{detailContent}</div>

			{/* DIV 4: Footer (Option) */}
			{footerContent && (
				<>
					<hr className="my-6 border-gray-200 border-dashed" />
					<div className="mt-4">{footerContent}</div>
				</>
			)}
		</div>
	);

	// Render Logic
	if (isModal) {
		// Nếu là Modal -> Dùng Portal + Overlay Blur
		if (!mounted || !isOpen) return null;

		return createPortal(
			<div
				className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
				onClick={onClose} // Click ra ngoài thì đóng
			>
				{MainContent}
			</div>,
			document.body
		);
	}

	// Nếu không phải Modal -> Render Inline bình thường
	return MainContent;
};
