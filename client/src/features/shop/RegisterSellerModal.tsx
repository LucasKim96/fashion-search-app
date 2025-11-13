"use client";
import { useRouter } from "next/navigation";

export default function RegisterSellerModal({ onClose }) {
	const router = useRouter();

	const handleConfirm = () => {
		onClose();
		router.push("/user/register-shop");
	};

	return (
		<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
			<div className="bg-white p-6 rounded-xl shadow-lg text-center w-[400px]">
				<p className="mb-4 text-gray-700">
					Bạn chưa đăng ký người bán. Bạn có muốn đăng ký ngay không?
				</p>
				<div className="flex justify-center gap-4">
					<button
						onClick={onClose}
						className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">
						Hủy
					</button>
					<button
						onClick={handleConfirm}
						className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition">
						Đăng ký ngay
					</button>
				</div>
			</div>
		</div>
	);
}
