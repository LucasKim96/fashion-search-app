"use client";
import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import clsx from "clsx";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
	message: string;
	type: ToastType;
}

interface ConfirmOptions {
	message: string;
	onConfirm: () => void;
	onCancel?: () => void;
	title?: string;
	confirmButtonText?: string;
	cancelButtonText?: string;
	variant?: "info" | "warning" | "danger";
}

interface NotificationContextProps {
	showToast: (message: string, type?: ToastType) => void;
	showConfirm: (options: ConfirmOptions) => void;
}

const NotificationContext = createContext<NotificationContextProps | null>(
	null
);

export const useNotification = (): NotificationContextProps => {
	const ctx = useContext(NotificationContext);
	if (!ctx)
		throw new Error("useNotification must be used within NotificationProvider");
	return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [toast, setToast] = useState<Toast | null>(null);
	const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);

	const TOAST_DURATION = 4000;

	/** ------------------- TOAST ------------------- */
	const showToast = useCallback((message: string, type: ToastType = "info") => {
		setToast({ message, type });

		const timer = setTimeout(() => setToast(null), TOAST_DURATION);
		return () => clearTimeout(timer);
	}, []);

	/** ------------------- CONFIRM ------------------- */
	const showConfirm = useCallback((options: ConfirmOptions) => {
		setConfirm(options);
	}, []);

	const [toastRoot, setToastRoot] = useState<HTMLElement | null>(null);
	useEffect(() => {
		let root = document.getElementById("toast-root");
		if (!root) {
			root = document.createElement("div");
			root.id = "toast-root";
			document.body.appendChild(root);
		}
		setToastRoot(root);
	}, []);

	// --- Helper để lấy style theo variant ---
	const getConfirmStyles = (variant: string = "info") => {
		switch (variant) {
			case "danger":
				return {
					iconBg: "bg-red-100",
					iconColor: "text-red-600",
					// SỬA: Thêm class màu chữ "text-white" để đảm bảo luôn hiển thị
					btnBg: "bg-red-600 hover:bg-red-700 text-white",
					icon: <XCircle className="w-8 h-8" />,
				};
			case "warning":
				return {
					iconBg: "bg-yellow-100",
					iconColor: "text-yellow-600",
					// SỬA: Thêm class màu chữ "text-white"
					btnBg: "bg-yellow-600 hover:bg-yellow-700 text-white",
					icon: <AlertTriangle className="w-8 h-8" />,
				};
			default: // info
				return {
					iconBg: "bg-blue-100",
					iconColor: "text-blue-600",
					// SỬA: Đảm bảo màu chữ và màu nền luôn tương phản
					// Thay vì dùng bg-primary có thể không chắc chắn, dùng màu cụ thể
					btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
					icon: <Info className="w-8 h-8" />,
				};
		}
	};

	return (
		<NotificationContext.Provider value={{ showToast, showConfirm }}>
			{children}

			{/* ------------------- TOAST ------------------- */}
			{toast &&
				toastRoot &&
				createPortal(
					<div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999] w-full flex justify-center pointer-events-none">
						<div
							className={clsx(
								"flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl font-medium text-sm pointer-events-auto justify-center animate-fade-in transform transition-all duration-300",
								"w-[500px] min-w-[300px] max-w-[90vw] backdrop-blur-sm bg-opacity-90",
								{
									"bg-gradient-to-r from-green-500 to-green-600 text-white":
										toast.type === "success",
									"bg-gradient-to-r from-red-500 to-red-600 text-white":
										toast.type === "error",
									"bg-gradient-to-r from-blue-500 to-indigo-600 text-white":
										toast.type === "info",
									"bg-gradient-to-r from-yellow-500/90 to-orange-500/90 text-white":
										toast.type === "warning",
								}
							)}>
							{/* Icon */}
							{toast.type === "success" && <CheckCircle className="w-5 h-5" />}
							{toast.type === "error" && <AlertTriangle className="w-5 h-5" />}
							{toast.type === "info" && <Info className="w-5 h-5" />}
							{toast.type === "warning" && (
								<AlertTriangle className="w-5 h-5" />
							)}

							{/* Message */}
							<span className="text-center break-words">{toast.message}</span>

							{/* Decorative glow */}
							<span className="absolute -inset-1 rounded-xl bg-white/10 blur-xl pointer-events-none animate-pulse"></span>
						</div>
					</div>,
					toastRoot
				)}

			{/* ------------------- CONFIRM ------------------- */}
			{confirm &&
				createPortal(
					<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
						<div className="bg-white rounded-2xl shadow-2xl p-6 w-[500px] max-w-[90vw] relative overflow-hidden border border-gray-200">
							{(() => {
								// 1. Lấy style dựa trên variant (info/warning/danger)
								const styles = getConfirmStyles(confirm.variant);

								return (
									<>
										<div className="flex flex-col items-center text-center">
											{/* 2. Áp dụng màu nền và màu icon (styles.iconBg, styles.iconColor) */}
											<div
												className={clsx(
													"p-3 rounded-full mb-4",
													styles.iconBg,
													styles.iconColor
												)}>
												{styles.icon}
											</div>

											<h3 className="text-lg font-bold text-gray-900 mb-2">
												{confirm.title || "Xác nhận hành động"}
											</h3>

											<p className="text-gray-600 text-sm mb-8 leading-relaxed">
												{confirm.message}
											</p>
										</div>

										{/* Buttons */}
										<div className="flex gap-3">
											<button
												className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all"
												onClick={() => {
													confirm.onCancel?.();
													setConfirm(null);
												}}>
												{confirm.cancelButtonText || "Hủy bỏ"}
											</button>

											{/* 3. Áp dụng màu nút bấm (styles.btnBg) */}
											<button
												className={clsx(
													"flex-1 px-4 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-95",
													styles.btnBg
												)}
												onClick={() => {
													confirm.onConfirm();
													setConfirm(null);
												}}>
												{confirm.confirmButtonText || "Xác nhận"}
											</button>
										</div>
									</>
								);
							})()}
						</div>
					</div>,
					document.body
				)}
		</NotificationContext.Provider>
	);
};
