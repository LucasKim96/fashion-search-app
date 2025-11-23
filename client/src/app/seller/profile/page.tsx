"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@shared/core/ui/NotificationProvider";
// Sửa lại đường dẫn nếu cần
import { deleteShopApi, getMyShopApi } from "@/features/shop/shop.api";
import { ShopResponse } from "@/features/shop/shop.types";
import { Trash2, Calendar } from "lucide-react"; // Thêm icon Calendar
import { buildImageUrl } from "@shared/core/utils/image.utils";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

// Helper function để định dạng ngày tháng cho đẹp hơn
const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("vi-VN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
};

export default function ShopProfilePage() {
	const router = useRouter();
	const { showToast } = useNotification();
	const [myShop, setMyShop] = useState<ShopResponse | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [pageLoading, setPageLoading] = useState(true);

	useEffect(() => {
		const fetchMyShop = async () => {
			try {
				const response = await getMyShopApi();
				setMyShop(response.data);
			} catch (error) {
				showToast("Không thể tải thông tin shop", "error");
				console.error(error);
			} finally {
				setPageLoading(false);
			}
		};
		fetchMyShop();
	}, [showToast]);

	const handleDeleteShop = async () => {
		if (!myShop?._id) {
			showToast("Không tìm thấy ID của shop để xóa", "error");
			return;
		}
		setLoading(true);
		try {
			const response = await deleteShopApi(myShop._id);
			showToast(response.message || "Xóa shop thành công!", "success");
			router.push("/user/profile");
		} catch (err: any) {
			showToast(
				err?.response?.data?.message || err.message || "Lỗi không xác định",
				"error"
			);
		} finally {
			setLoading(false);
			setIsModalOpen(false);
		}
	};

	// Xử lý lỗi khi ảnh không tải được
	const handleImageError = (
		e: React.SyntheticEvent<HTMLImageElement, Event>
	) => {
		const target = e.target as HTMLImageElement;

		// Tạo URL đầy đủ cho ảnh mặc định
		// Lưu ý: Tôi đã sửa "ahop" thành "shop" vì đó có thể là lỗi đánh máy.
		const defaultLogoUrl = buildImageUrl("/assets/shop/default-logo.png");
		const defaultCoverUrl = buildImageUrl("/assets/shop/default-cover.jpg");

		// Ngăn vòng lặp vô hạn nếu chính ảnh mặc định cũng bị lỗi
		if (target.src === defaultLogoUrl || target.src === defaultCoverUrl) {
			return;
		}

		if (target.id === "shop-logo") {
			target.src = defaultLogoUrl;
		} else if (target.id === "shop-cover") {
			target.src = defaultCoverUrl;
		}
	};

	if (pageLoading) {
		return (
			<div className="p-8 text-center">Đang tải thông tin cửa hàng...</div>
		);
	}

	if (!myShop) {
		return (
			<div className="p-8">Không tìm thấy thông tin cửa hàng của bạn.</div>
		);
	}

	return (
		<div className="p-4 sm:p-6 lg:p-8 space-y-8">
			{/* Phần Card thông tin chính của Shop */}
			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				{/* --- Ảnh bìa --- */}
				<div className="relative">
					<img
						id="shop-cover"
						src={buildImageUrl(myShop.coverUrl)}
						alt="Ảnh bìa cửa hàng"
						onError={handleImageError}
						className="w-full h-48 object-cover"
					/>
					{/* --- Logo --- */}
					{/* Dùng negative margin để kéo logo lên trên ảnh bìa */}
					<div className="absolute left-6 -bottom-12">
						<img
							id="shop-logo"
							src={buildImageUrl(myShop.logoUrl)}
							alt="Logo cửa hàng"
							onError={handleImageError}
							className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 object-cover shadow-lg"
						/>
					</div>
				</div>

				{/* --- Tên và thông tin cơ bản --- */}
				{/* Thêm padding-top để tạo khoảng trống cho logo */}
				<div className="pt-16 px-6 pb-4">
					<h1 className="text-3xl font-bold text-gray-800">
						{myShop.shopName}
					</h1>
					<div className="flex items-center text-sm text-gray-500 mt-2">
						<Calendar size={16} className="mr-2" />
						<span>Tham gia vào {formatDate(myShop.createdAt)}</span>
					</div>
				</div>

				{/* --- Mô tả Shop --- */}
				<div className="px-6 pb-6">
					<h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-3">
						Mô tả cửa hàng
					</h2>
					<p className="text-gray-600 whitespace-pre-wrap">
						{myShop.description || "Chưa có mô tả."}
					</p>
				</div>
			</div>

			{/* Phần Vùng nguy hiểm (Xóa shop) */}
			<div className="p-4 border border-red-300 bg-red-50 rounded-lg">
				<h2 className="text-lg font-semibold text-red-800">Vùng nguy hiểm</h2>
				<p className="text-red-700 mt-1">
					Xóa cửa hàng của bạn là một hành động vĩnh viễn và không thể hoàn tác.
				</p>
				<button
					onClick={() => setIsModalOpen(true)}
					className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
					<Trash2 size={18} />
					Xóa cửa hàng
				</button>
			</div>

			{/* Modal xác nhận xóa */}
			<ConfirmationModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onConfirm={handleDeleteShop}
				loading={loading}
				title="Xác nhận Xóa Shop"
				description="Bạn có chắc chắn muốn xóa shop vĩnh viễn không? Tất cả sản phẩm và dữ liệu liên quan sẽ bị mất."
				confirmButtonText="Đồng ý Xóa"
			/>
		</div>
	);
}
