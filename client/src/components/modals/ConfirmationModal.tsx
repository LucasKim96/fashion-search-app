"use client";

import { Loader2 } from "lucide-react";

// Định nghĩa các props mà component sẽ nhận
interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	loading: boolean;
	title?: string;
	description?: string;
	confirmButtonText?: string;
	cancelButtonText?: string;
}

export default function ConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	loading,
	title = "Xác nhận hành động", // Tiêu đề mặc định
	description = "Bạn có chắc chắn muốn thực hiện hành động này? Nó không thể được hoàn tác.", // Mô tả mặc định
	confirmButtonText = "Xác nhận", // Text nút xác nhận mặc định
	cancelButtonText = "Hủy", // Text nút hủy mặc định
}: ConfirmationModalProps) {
	// Nếu modal không mở, không render gì cả
	if (!isOpen) {
		return null;
	}

	return (
		// Lớp phủ toàn màn hình
		<div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300">
			{/* Nội dung modal */}
			<div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full transform transition-all duration-300 scale-95 animate-fade-in-up">
				<h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
				<p className="text-gray-600 mb-6">{description}</p>

				{/* Các nút hành động */}
				<div className="flex justify-end gap-4">
					<button
						onClick={onClose}
						disabled={loading}
						className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
						{cancelButtonText}
					</button>
					<button
						onClick={onConfirm}
						disabled={loading}
						className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px] transition-colors">
						{loading ? (
							<>
								<Loader2 className="animate-spin" size={20} />
								<span>Đang xử lý...</span>
							</>
						) : (
							confirmButtonText
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
