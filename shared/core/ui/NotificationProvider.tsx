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
					btnBg: "bg-red-600 hover:bg-red-700",
					icon: <XCircle className="w-8 h-8" />,
				};
			case "warning":
				return {
					iconBg: "bg-yellow-100",
					iconColor: "text-yellow-600",
					btnBg: "bg-yellow-600 hover:bg-yellow-700",
					icon: <AlertTriangle className="w-8 h-8" />,
				};
			default: // info
				return {
					iconBg: "bg-blue-100",
					iconColor: "text-blue-600",
					btnBg: "bg-primary hover:bg-primary-dark text-black", // Dùng màu brand của bạn
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
								}
							)}>
							{/* Icon */}
							{toast.type === "success" && <CheckCircle className="w-5 h-5" />}
							{toast.type === "error" && <AlertTriangle className="w-5 h-5" />}
							{toast.type === "info" && <Info className="w-5 h-5" />}

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
							{/* Icon cảnh báo */}
							<div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-tr from-blue-500 to-indigo-500 p-4 rounded-full shadow-xl">
								<Info className="text-white w-6 h-6" />
							</div>

							{/* Message */}
							<p className="text-gray-800 text-base mt-6 mb-6 text-center font-medium leading-relaxed">
								{confirm.message}
							</p>

							{/* Buttons */}
							<div className="flex justify-center gap-4">
								<button
									className="px-5 py-2 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all shadow-sm hover:shadow-md transform active:scale-95"
									onClick={() => {
										confirm.onCancel?.();
										setConfirm(null);
									}}>
									Hủy
								</button>
								<button
									className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-lg transition-all transform active:scale-95"
									onClick={() => {
										confirm.onConfirm();
										setConfirm(null);
									}}>
									Xác nhận
								</button>
							</div>

							{/* Decorative blur circles */}
							<span className="absolute -top-16 -left-16 w-40 h-40 rounded-full bg-blue-200 opacity-20 blur-3xl"></span>
							<span className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full bg-indigo-200 opacity-20 blur-3xl"></span>
						</div>
					</div>,
					document.body
				)}
		</NotificationContext.Provider>
	);
};
