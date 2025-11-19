"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

interface ProductDetailLayoutProps {
	// --- Chế độ hiển thị ---
	isModal?: boolean;
	isOpen?: boolean;
	onClose?: () => void;

	// --- Cấu hình kích thước ---
	/**
	 * Width của Modal khi hiển thị dạng Popup.
	 * VD: "max-w-4xl", "w-[800px]", "max-w-5xl"
	 * Default: "w-full max-w-5xl"
	 */
	modalWidth?: string;

	/**
	 * Width của Div 1 (Cột chứa ảnh).
	 * Div 2 sẽ chiếm phần còn lại.
	 * Nên truyền class responsive. VD: "w-full md:w-[250px]" hoặc "w-full md:w-1/3"
	 */
	imageWidth?: string;

	// --- Nội dung các phần ---
	imageContent: React.ReactNode; // Div 1
	headerContent: React.ReactNode; // Div 2
	detailContent: React.ReactNode; // Div 3
	footerContent?: React.ReactNode; // Div 4

	// --- Style tùy chỉnh ---
	className?: string;
}

export const ProductDetailLayout: React.FC<ProductDetailLayoutProps> = ({
	isModal = false,
	isOpen = false,
	onClose,

	// Cấu hình mặc định
	modalWidth = "w-full max-w-5xl",
	imageWidth = "w-full md:w-1/3", // Mặc định trên mobile full, desktop 1/3

	imageContent,
	headerContent,
	detailContent,
	footerContent,
	className,
}) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		if (isModal && isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isModal, isOpen]);

	// Nội dung chính
	const MainContent = (
		<div
			className={clsx(
				"bg-white p-6 rounded-2xl shadow-sm",
				isModal
					? clsx(
							"shadow-2xl relative animate-in fade-in zoom-in duration-300 mx-4",
							modalWidth // <--- Áp dụng width cho Modal tại đây
					  )
					: "border border-gray-200 w-full", // <--- Chế độ thường: w-full chiếm hết cha
				className
			)}
			onClick={(e) => e.stopPropagation()}>
			{/* Nút Close (Chỉ hiện khi Modal) */}
			{isModal && (
				<button
					onClick={onClose}
					className="absolute -top-12 right-0 md:-right-12 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 hover:rotate-90 transition-all duration-300 backdrop-blur-md shadow-lg border border-white/30"
					title="Đóng">
					<X size={24} strokeWidth={2.5} />
				</button>
			)}

			{/* HEADER GROUP: Div 1 (Ảnh) + Div 2 (Thông tin) */}
			<div className="flex flex-col md:flex-row gap-6 items-start">
				{/* DIV 1: Vùng chứa ảnh */}
				{/* flex-shrink-0: Không bị co lại nhỏ hơn imageWidth quy định */}
				<div className={clsx("flex-shrink-0", imageWidth)}>{imageContent}</div>

				{/* DIV 2: Vùng thông tin */}
				{/* flex-1: Chiếm toàn bộ không gian còn lại sau khi trừ đi Div 1 */}
				{/* min-w-0: Ngăn text bị tràn ra khỏi flex container */}
				<div className="flex-1 min-w-0">{headerContent}</div>
			</div>

			{/* DIV 3: Chi tiết (Full width bên dưới) */}
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
		if (!mounted || !isOpen) return null;
		return createPortal(
			<div
				className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
				onClick={onClose}>
				{/* Wrapper này để căn giữa modal nếu chiều cao modal nhỏ hơn màn hình */}
				<div className="flex min-h-full items-center justify-center w-full py-8">
					{MainContent}
				</div>
			</div>,
			document.body
		);
	}

	return MainContent;
};
