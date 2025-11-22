"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // 1. Import createPortal
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
	imageUrl?: string;
	alt?: string;
	open: boolean;
	onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
	imageUrl,
	alt = "Preview",
	open,
	onClose,
}) => {
	// 2. State để đảm bảo code chỉ chạy ở Client (tránh lỗi Hydration)
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);

		// (Tuỳ chọn) Khóa cuộn trang web khi modal mở
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}

		return () => {
			document.body.style.overflow = "unset";
		};
	}, [open]);

	// Nếu chưa mount hoặc không mở thì không render gì cả (để tránh lỗi document is not defined)
	if (!mounted) return null;

	// 3. Sử dụng createPortal để đẩy Modal ra ngoài body
	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					// 4. Tăng z-index lên rất cao (z-[9999]) để đảm bảo đè lên mọi thứ (header, sidebar...)
					className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md pt-0"
					onClick={onClose} // Click ra ngoài để đóng
				>
					{/* Background effect */}
					<div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />

					<motion.div
						initial={{ scale: 0.5, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.5, opacity: 0 }}
						transition={{
							type: "spring",
							stiffness: 300,
							damping: 25,
						}}
						// Ngăn sự kiện click đóng modal khi click vào ảnh
						onClick={(e) => e.stopPropagation()}
						className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
						<div className="relative p-1 rounded-3xl">
							<div className="rounded-2xl overflow-hidden bg-black/50">
								<img
									src={imageUrl || "/default-avatar.png"}
									alt={alt}
									className="object-contain max-w-full max-h-[85vh] rounded-2xl"
								/>
							</div>
						</div>

						{/* Nút đóng */}
						<button
							onClick={onClose}
							className="absolute -top-4 -right-4 md:-top-8 md:-right-8 z-50 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-90">
							<X className="w-6 h-6" />
						</button>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body // Render trực tiếp vào body
	);
};

// "use client";

// import React from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X } from "lucide-react";

// interface ImagePreviewModalProps {
// 	imageUrl?: string;
// 	alt?: string;
// 	open: boolean;
// 	onClose: () => void;
// }

// export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
// 	imageUrl,
// 	alt = "Preview",
// 	open,
// 	onClose,
// }) => {
// 	return (
// 		<AnimatePresence>
// 			{open && (
// 				<motion.div
// 					initial={{ opacity: 0 }}
// 					animate={{ opacity: 1 }}
// 					exit={{ opacity: 0 }}
// 					className="pt-20 fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
// 					<div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />

// 					<motion.div
// 						initial={{ scale: 0.9, opacity: 0 }}
// 						animate={{ scale: 1, opacity: 1 }}
// 						exit={{ scale: 0.9, opacity: 0 }}
// 						transition={{ duration: 0.25, ease: "easeOut" }}
// 						className="relative rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.2)] overflow-hidden border border-white/20 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
// 						<div className="relative p-[3px] rounded-3xl bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
// 							<div className="rounded-3xl bg-black/40 backdrop-blur-sm overflow-hidden border border-white/10">
// 								<img
// 									src={imageUrl || "/default-avatar.png"}
// 									alt={alt}
// 									className="object-contain max-w-[90vw] max-h-[80vh] rounded-2xl"
// 								/>
// 							</div>
// 						</div>

// 						<div className="absolute inset-0 rounded-3xl ring-1 ring-white/30 pointer-events-none"></div>

// 						<button
// 							onClick={onClose}
// 							className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300">
// 							<X className="w-5 h-5" />
// 						</button>
// 					</motion.div>
// 				</motion.div>
// 			)}
// 		</AnimatePresence>
// 	);
// };
