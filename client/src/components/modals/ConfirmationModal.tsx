"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, AlertTriangle } from "lucide-react"; // Thêm icon cảnh báo
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

// Định nghĩa các props mà component sẽ nhận
interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	loading: boolean;
	title?: string;
	description?: React.ReactNode;
	confirmButtonText?: string;
	cancelButtonText?: string;
	variant?: "primary" | "warning" | "danger";
}

export default function ConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	loading,
	title = "Xác nhận hành động",
	description = "Bạn có chắc chắn muốn thực hiện hành động này?",
	confirmButtonText = "Xác nhận",
	cancelButtonText = "Hủy",
	variant = "primary", // Mặc định là 'primary'
}: ConfirmationModalProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		// Khóa cuộn trang
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [isOpen]);

	if (!mounted) return null;

	// --- LOGIC CHỌN MÀU SẮC DỰA TRÊN VARIANT ---
	const confirmButtonStyles = {
		primary: "bg-primary text-white hover:bg-primary-dark",
		warning: "bg-yellow-500 text-white hover:bg-yellow-600",
		danger: "bg-red-600 text-white hover:bg-red-700",
	};

	const iconStyles = {
		primary: "text-primary",
		warning: "text-yellow-500",
		danger: "text-red-600",
	};

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
					onClick={onClose} // Click ra ngoài để đóng
				>
					<motion.div
						initial={{ scale: 0.9, y: 20 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0.9, y: 20 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full"
						onClick={(e) => e.stopPropagation()}>
						<div className="flex items-start gap-4">
							{/* Icon cảnh báo */}
							<div
								className={clsx(
									"flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center",
									iconStyles[variant]
								)}>
								<AlertTriangle size={24} />
							</div>

							<div className="flex-1">
								<h2 className="text-xl font-bold text-gray-800">{title}</h2>
								<p className="text-gray-500 mt-2">{description}</p>
							</div>
						</div>

						{/* Các nút hành động */}
						<div className="flex justify-end gap-4 mt-6">
							<button
								onClick={onClose}
								disabled={loading}
								className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
								{cancelButtonText}
							</button>
							<button
								onClick={onConfirm}
								disabled={loading}
								className={clsx(
									"px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px] transition-colors shadow-md",
									confirmButtonStyles[variant]
								)}>
								{loading ? (
									<>
										<Loader2 className="animate-spin" size={18} />
										<span>Đang xử lý...</span>
									</>
								) : (
									confirmButtonText
								)}
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body
	);
}
