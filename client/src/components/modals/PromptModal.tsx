"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface PromptModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (value: string) => Promise<void> | void;
	title: string;
	description?: string;
	placeholder?: string;
	confirmText?: string;
	loading?: boolean;
	variant?: "danger" | "warning" | "info";
}

const PromptModal: React.FC<PromptModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	placeholder = "Nhập nội dung...",
	confirmText = "Xác nhận",
	loading = false,
	variant = "info",
}) => {
	const [value, setValue] = useState("");
	const [error, setError] = useState("");

	if (!isOpen) return null;

	const handleSubmit = async () => {
		if (!value.trim()) {
			setError("Vui lòng nhập nội dung.");
			return;
		}
		setError("");
		await onConfirm(value);
		setValue(""); // Reset sau khi thành công
	};

	// Màu sắc dựa theo variant
	const isDanger = variant === "danger";

	return createPortal(
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4">
			<div
				className="absolute inset-0"
				onClick={!loading ? onClose : undefined}
			/>
			<div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
				<button
					onClick={onClose}
					disabled={loading}
					className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
					<X size={20} />
				</button>

				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-3">
						{isDanger && (
							<div className="p-2 bg-red-100 rounded-full text-red-600">
								<AlertTriangle size={24} />
							</div>
						)}
						<h3 className="text-xl font-bold text-gray-800">{title}</h3>
					</div>

					{description && (
						<p className="text-gray-600 text-sm">{description}</p>
					)}

					<div className="space-y-2">
						<textarea
							className={clsx(
								"w-full border rounded-xl p-3 outline-none focus:ring-2 transition-all resize-none text-sm",
								error
									? "border-red-500 focus:ring-red-200"
									: "border-gray-300 focus:border-primary focus:ring-primary/20"
							)}
							rows={3}
							placeholder={placeholder}
							value={value}
							onChange={(e) => {
								setValue(e.target.value);
								if (error) setError("");
							}}
							disabled={loading}
							autoFocus
						/>
						{error && (
							<p className="text-red-500 text-xs font-medium">{error}</p>
						)}
					</div>

					<div className="flex justify-end gap-3 mt-2">
						<button
							onClick={onClose}
							disabled={loading}
							className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
							Hủy bỏ
						</button>
						<button
							onClick={handleSubmit}
							disabled={loading}
							className={clsx(
								"px-6 py-2 rounded-lg text-white font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50",
								isDanger
									? "bg-red-600 hover:bg-red-700"
									: "bg-primary text-black hover:bg-primary-light"
							)}>
							{loading ? "Đang xử lý..." : confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>,
		document.body
	);
};

export default PromptModal;
