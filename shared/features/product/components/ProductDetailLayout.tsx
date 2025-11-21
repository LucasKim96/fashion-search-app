"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";

interface ProductDetailLayoutProps {
	isModal?: boolean;
	isOpen?: boolean;
	onClose?: () => void;
	hasUpdated?: boolean;
	onRefresh?: () => void;

	modalWidth?: string;
	imageWidth?: string;

	imageContent: React.ReactNode;
	headerContent: React.ReactNode;
	detailContent: React.ReactNode;
	footerContent?: React.ReactNode;

	className?: string;
}

export const ProductDetailLayout: React.FC<ProductDetailLayoutProps> = ({
	isModal = false,
	isOpen = false,
	onClose,
	hasUpdated = false,
	onRefresh,

	modalWidth = "w-full max-w-5xl",
	imageWidth = "w-full md:w-1/3",

	imageContent,
	headerContent,
	detailContent,
	footerContent,
	className,
}) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		// Khóa cuộn trang web chính khi Modal mở
		if (isModal && isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isModal, isOpen]);

	// Logic đóng
	const handleClose = (e?: React.MouseEvent) => {
		e?.stopPropagation();
		if (isModal && hasUpdated && onRefresh) {
			onRefresh();
		}
		onClose?.();
	};

	// --- NỘI DUNG CHUNG  ---
	const InnerBody = (
		<>
			{/* Header Group: Ảnh + Thông tin */}
			<div className="flex flex-col md:flex-row gap-6 items-start">
				<div className={clsx("flex-shrink-0", imageWidth)}>{imageContent}</div>
				<div className="flex-1 min-w-0">{headerContent}</div>
			</div>

			{/* Detail */}
			<div className="mt-6">{detailContent}</div>

			{/* Footer */}
			{footerContent && (
				<>
					<hr className="my-6 border-gray-200 border-dashed" />
					<div className="mt-4">{footerContent}</div>
				</>
			)}
		</>
	);

	// --- TRƯỜNG HỢP 1: RENDER MODAL (CÓ THANH LĂN) ---
	if (isModal) {
		if (!mounted || !isOpen) return null;

		return createPortal(
			<div
				className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
				onClick={handleClose}>
				{/* Wrapper định vị (Relative) để đặt nút X */}
				<div
					className={clsx(
						"relative animate-in fade-in zoom-in duration-300 mx-4",
						modalWidth
					)}
					onClick={(e) => e.stopPropagation()} // Chặn click xuyên qua modal
				>
					{/* Nút X nằm bên ngoài (Desktop) */}
					<button
						onClick={handleClose}
						className={clsx(
							"absolute z-50 p-2 rounded-full text-white transition-all duration-300 shadow-lg border border-white/30 backdrop-blur-md",
							"top-2 right-2 bg-black/20 hover:bg-black/40 text-gray-600 md:text-white", // Mobile: Nằm trong
							"md:top-0 md:-right-14 md:bg-white/20 md:hover:bg-white/40 md:hover:rotate-90" // Desktop: Nằm ngoài
						)}
						title="Đóng">
						<X size={24} strokeWidth={2.5} />
					</button>

					{/* Hộp nội dung Modal: CÓ THANH LĂN */}
					{/* Hộp nội dung Modal: CÓ THANH LĂN */}
					<div
						className={clsx(
							// 1. LỚP VỎ NGOÀI: Định hình khung và cắt góc
							"bg-white rounded-2xl shadow-2xl",
							"max-h-[85vh] flex flex-col overflow-hidden", // overflow-hidden để bo góc cắt thanh lăn
							className
						)}>
						{/* 2. LỚP NỘI DUNG: Chứa padding và thanh lăn custom */}
						<div
							className={clsx(
								"p-6 overflow-y-auto h-full", // Padding và scroll nằm ở đây

								// --- Style Thanh Lăn Đẹp (Floating Scrollbar) ---
								"[&::-webkit-scrollbar]:w-[10px]", // Độ rộng vùng chứa thanh lăn
								"[&::-webkit-scrollbar-track]:bg-transparent", // Nền trong suốt
								"[&::-webkit-scrollbar-thumb]:bg-gray-300/80", // Màu thanh lăn
								"[&::-webkit-scrollbar-thumb]:rounded-full", // Bo tròn thanh lăn
								"[&::-webkit-scrollbar-thumb]:border-[2px]", // Viền...
								"[&::-webkit-scrollbar-thumb]:border-solid",
								"[&::-webkit-scrollbar-thumb]:border-transparent", // ...trong suốt để tạo khoảng cách (padding giả)
								"[&::-webkit-scrollbar-thumb]:bg-clip-content", // Cắt nền để hiện viền trong suốt
								"hover:[&::-webkit-scrollbar-thumb]:bg-gray-400" // Đậm lên khi hover
							)}>
							{InnerBody}
						</div>
					</div>
				</div>
			</div>,
			document.body
		);
	}

	// --- TRƯỜNG HỢP 2: RENDER COMPONENT THƯỜNG (KHÔNG THANH LĂN) ---
	return (
		<div
			className={clsx(
				"bg-white p-6 rounded-2xl border border-gray-200 shadow-sm",
				"w-full h-auto", // <--- KHÔNG CÓ max-h, KHÔNG CÓ overflow
				className
			)}>
			{InnerBody}
		</div>
	);
};
