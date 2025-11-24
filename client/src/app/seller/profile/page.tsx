"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import {
	getMyShopForManagementApi,
	softDeleteMyShopApi,
	hardDeleteMyShopApi,
	restoreMyShopApi,
} from "@/features/shop/shop.api";
import { ShopResponse } from "@/features/shop/shop.types";
import { Trash2, Calendar, EyeOff, ShieldX, RotateCw } from "lucide-react";
import { buildImageUrl } from "@shared/core";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import clsx from "clsx";

// Helper để định dạng ngày tháng
const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("vi-VN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
};

// ===================================================================
// CÁC COMPONENT CON ĐỂ GIAO DIỆN SẠCH SẼ HƠN
// ===================================================================

const LoadingState = () => (
	<div className="p-8 text-center text-gray-500">
		<p className="animate-pulse">Đang tải thông tin cửa hàng...</p>
	</div>
);

const NoShopState = () => {
	const router = useRouter();
	return (
		<div className="p-8 text-center bg-white rounded-2xl shadow-md">
			<h2 className="text-2xl font-bold text-gray-800">Bạn chưa có cửa hàng</h2>
			<p className="mt-2 text-gray-500">
				Hãy đăng ký ngay để bắt đầu hành trình kinh doanh của bạn!
			</p>
			<button
				onClick={() => router.push("/seller/register-shop")}
				className="mt-6 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-transform hover:scale-105">
				Đăng ký ngay
			</button>
		</div>
	);
};

const RestoreShopBanner = ({
	onRestore,
	loading,
}: {
	onRestore: () => void;
	loading: boolean;
}) => (
	<div className="p-6 border-2 border-dashed border-yellow-400 bg-yellow-50 rounded-2xl text-center">
		<h2 className="text-2xl font-bold text-yellow-800">
			Cửa hàng của bạn đang bị tạm ẩn
		</h2>
		<p className="mt-2 text-yellow-700">
			Khách hàng sẽ không thể thấy cửa hàng hoặc sản phẩm của bạn. Bạn có muốn
			kích hoạt lại không?
		</p>
		<button
			onClick={onRestore}
			disabled={loading}
			className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition shadow-md disabled:bg-gray-400">
			<RotateCw className={loading ? "animate-spin" : ""} size={20} />
			{loading ? "Đang xử lý..." : "Kích hoạt lại cửa hàng"}
		</button>
	</div>
);

// ===================================================================
// COMPONENT CHÍNH
// ===================================================================
export default function ShopProfilePage() {
	const router = useRouter();
	const { showToast } = useNotification();

	const [myShop, setMyShop] = useState<ShopResponse | null>(null);
	const [pageLoading, setPageLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [softDeleteModalOpen, setSoftDeleteModalOpen] = useState(false);
	const [hardDeleteModalOpen, setHardDeleteModalOpen] = useState(false);

	const fetchMyShop = useCallback(async () => {
		try {
			const response = await getMyShopForManagementApi();
			setMyShop(response.data);
		} catch (error) {
			setMyShop(null);
		} finally {
			setPageLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMyShop();
	}, [fetchMyShop]);

	const handleAction = async (
		apiCall: () => Promise<any>,
		successMessage: string,
		errorMessage: string,
		onFinally?: () => void
	) => {
		setActionLoading(true);
		try {
			const response = await apiCall();
			showToast(response.message || successMessage, "success");
			// Dùng reload để đảm bảo state toàn cục (useAuth) cũng được cập nhật
			window.location.reload();
		} catch (err: any) {
			showToast(err?.response?.data?.message || errorMessage, "error");
		} finally {
			setActionLoading(false);
			if (onFinally) onFinally();
		}
	};

	const handleSoftDeleteShop = () =>
		handleAction(
			softDeleteMyShopApi,
			"Ẩn shop thành công!",
			"Lỗi khi ẩn shop",
			() => setSoftDeleteModalOpen(false)
		);

	const handleHardDeleteShop = () =>
		handleAction(
			hardDeleteMyShopApi,
			"Xóa shop vĩnh viễn thành công!",
			"Lỗi khi xóa shop",
			() => setHardDeleteModalOpen(false)
		);

	const handleRestoreShop = async () => {
		setActionLoading(true);
		try {
			const response = await restoreMyShopApi();
			showToast(response.message || "Khôi phục shop thành công!", "success");
			await fetchMyShop(); // Tải lại dữ liệu trang này
		} catch (err: any) {
			showToast(
				err?.response?.data?.message || "Lỗi khi khôi phục shop",
				"error"
			);
		} finally {
			setActionLoading(false);
		}
	};

	if (pageLoading) return <LoadingState />;
	if (!myShop) return <NoShopState />;

	return (
		<div className="p-4 sm:p-6 lg:p-8 space-y-8">
			{myShop.isDeleted && (
				<RestoreShopBanner
					onRestore={handleRestoreShop}
					loading={actionLoading}
				/>
			)}

			<div
				className={clsx(
					"bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500",
					{ "opacity-60 blur-sm pointer-events-none": myShop.isDeleted }
				)}>
				{/* Ảnh bìa */}
				<div className="relative bg-gray-100 h-64 flex items-center justify-center">
					<img
						src={buildImageUrl(myShop.coverUrl)}
						alt="Ảnh bìa"
						className="w-full h-full object-contain"
					/>
				</div>

				<div className="relative px-6 pb-6">
					{/* Logo */}
					<div className="absolute left-6 -top-14">
						<div className="w-28 h-28 rounded-full border-4 border-white bg-gray-100 shadow-lg flex items-center justify-center overflow-hidden">
							<img
								src={buildImageUrl(myShop.logoUrl)}
								alt="Logo"
								className="w-full h-full object-contain"
							/>
						</div>
					</div>

					<div className="pt-16">
						<h1 className="text-4xl font-bold text-gray-900">
							{myShop.shopName}
						</h1>
						<div className="flex items-center text-sm text-gray-500 mt-2">
							<Calendar size={16} className="mr-2" />
							<span>Tham gia vào {formatDate(myShop.createdAt)}</span>
						</div>
					</div>
				</div>

				<div className="px-6 pb-6 border-t pt-6">
					<h2 className="text-xl font-semibold text-gray-800 mb-3">
						Giới thiệu cửa hàng
					</h2>
					<p className="text-gray-600 whitespace-pre-wrap">
						{myShop.description || "Chưa có mô tả."}
					</p>
				</div>
			</div>

			{!myShop.isDeleted && (
				<div className="p-6 border-2 border-dashed border-red-300 bg-red-50 rounded-2xl space-y-6">
					<div>
						<h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
							<EyeOff /> Ẩn cửa hàng
						</h2>
						<p className="text-red-700 mt-1">
							Hành động này sẽ tạm ẩn cửa hàng và sản phẩm. Vai trò "Chủ shop"
							sẽ được giữ lại để bạn có thể khôi phục sau.
						</p>
						<button
							onClick={() => setSoftDeleteModalOpen(true)}
							className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition shadow-md">
							Tiến hành Ẩn
						</button>
					</div>
					<hr className="border-red-200" />
					<div>
						<h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
							<ShieldX /> Xóa vĩnh viễn
						</h2>
						<p className="text-red-800 mt-1">
							Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu shop và sản phẩm.{" "}
							<strong className="uppercase">Không thể hoàn tác.</strong>
						</p>
						<button
							onClick={() => setHardDeleteModalOpen(true)}
							className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-800 transition shadow-md">
							<Trash2 size={18} /> Tôi hiểu, Xóa vĩnh viễn
						</button>
					</div>
				</div>
			)}

			{/* Modals */}
			<ConfirmationModal
				isOpen={softDeleteModalOpen}
				onClose={() => setSoftDeleteModalOpen(false)}
				onConfirm={handleSoftDeleteShop}
				loading={actionLoading}
				title="Xác nhận Ẩn Shop"
				description="Cửa hàng và sản phẩm sẽ không còn hiển thị với khách hàng. Bạn có chắc chắn muốn tiếp tục?"
				confirmButtonText="Đồng ý, Ẩn Shop"
				variant="warning"
			/>
			<ConfirmationModal
				isOpen={hardDeleteModalOpen}
				onClose={() => setHardDeleteModalOpen(false)}
				onConfirm={handleHardDeleteShop}
				loading={actionLoading}
				title="HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC!"
				description={
					<span>
						Bạn sắp xóa vĩnh viễn cửa hàng này. Toàn bộ dữ liệu sẽ bị mất. Vui
						lòng xác nhận lần cuối.
					</span>
				}
				confirmButtonText="Tôi chắc chắn, Xóa"
				variant="danger"
			/>
		</div>
	);
}
