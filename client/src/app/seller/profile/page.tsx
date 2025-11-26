"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import {
	getMyShopForManagementApi,
	closeMyShopApi,
	hardDeleteMyShopApi,
	reopenMyShopApi,
	updateShopApi, // API cập nhật thông tin cơ bản
	updateShopLogoApi, // API cập nhật Logo
	updateShopCoverApi, // API cập nhật Cover
} from "@shared/features/shop/shop.api";
import { ShopResponse } from "@shared/features/shop/shop.types";
import {
	Trash2,
	Calendar,
	EyeOff,
	ShieldX,
	Power,
	Edit2,
	Save,
	X,
	Camera,
} from "lucide-react";
import { buildImageUrl } from "@shared/core/utils/image.utils";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import clsx from "clsx";
import { ImageUploaderWithCrop } from "@/components/forms/ImageUploaderWithCrop";

const formatDate = (dateString: string) =>
	new Date(dateString).toLocaleDateString("vi-VN", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

// ===================================================================
// COMPONENT CHÍNH
// ===================================================================
export default function ShopProfilePage() {
	const router = useRouter();
	const { showToast } = useNotification();

	const [myShop, setMyShop] = useState<ShopResponse | null>(null);
	const [pageLoading, setPageLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false); // Chế độ chỉnh sửa

	// Modal states
	const [closeModalOpen, setCloseModalOpen] = useState(false);
	const [hardDeleteModalOpen, setHardDeleteModalOpen] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);

	// Form hook
	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm({
		defaultValues: {
			shopName: "",
			description: "",
		},
	});

	// Fetch Data
	const fetchMyShop = useCallback(async () => {
		setPageLoading(true);
		try {
			const response = await getMyShopForManagementApi();
			setMyShop(response.data);
			// Reset form với dữ liệu mới
			setValue("shopName", response.data.shopName);
			setValue("description", response.data.description);
		} catch (error) {
			setMyShop(null);
		} finally {
			setPageLoading(false);
		}
	}, [setValue]);

	useEffect(() => {
		fetchMyShop();
	}, [fetchMyShop]);

	// --- XỬ LÝ UPDATE INFO ---
	const onSubmitInfo = async (data: any) => {
		if (!myShop) return;
		setActionLoading(true);
		try {
			const res = await updateShopApi(myShop._id, data);
			if (res.success) {
				showToast("Cập nhật thông tin thành công!", "success");
				setMyShop(res.data);
				setIsEditing(false);
			}
		} catch (error: any) {
			showToast(error.message || "Lỗi cập nhật", "error");
		} finally {
			setActionLoading(false);
		}
	};

	// --- XỬ LÝ UPDATE ẢNH (Logo/Cover) ---
	const handleImageUpload = async (file: File, type: "logo" | "cover") => {
		if (!myShop) return;
		try {
			let res;
			if (type === "logo") {
				res = await updateShopLogoApi(myShop._id, file);
			} else {
				res = await updateShopCoverApi(myShop._id, file);
			}

			if (res.success) {
				showToast(`Cập nhật ${type} thành công!`, "success");
				setMyShop(res.data); // Cập nhật UI ngay lập tức
			}
		} catch (error: any) {
			showToast("Lỗi upload ảnh", "error");
		}
	};

	// --- CÁC HÀM XỬ LÝ TRẠNG THÁI (Đóng/Mở/Xóa) - Giữ nguyên logic cũ ---
	const handleReopenShop = async () => {
		setActionLoading(true);
		try {
			const response = await reopenMyShopApi();
			showToast("Mở lại shop thành công!", "success");
			await fetchMyShop();
		} catch (err: any) {
			showToast("Lỗi khi mở lại shop", "error");
		} finally {
			setActionLoading(false);
		}
	};

	const handleCloseShop = async () => {
		setActionLoading(true);
		try {
			await closeMyShopApi();
			showToast("Tạm đóng shop thành công!", "success");
			setCloseModalOpen(false);
			await fetchMyShop();
		} catch (err: any) {
			showToast("Lỗi khi đóng shop", "error");
		} finally {
			setActionLoading(false);
		}
	};

	const handleHardDeleteShop = async () => {
		setActionLoading(true);
		try {
			await hardDeleteMyShopApi();
			showToast("Đã xóa shop vĩnh viễn", "success");
			router.push("/"); // Về trang chủ hoặc logout
		} catch (err: any) {
			showToast("Lỗi khi xóa shop", "error");
		} finally {
			setActionLoading(false);
		}
	};

	// Render Loading / Empty
	if (pageLoading) return <div className="p-10 text-center">Đang tải...</div>;
	if (!myShop)
		return <div className="p-10 text-center">Bạn chưa có cửa hàng.</div>;

	const isShopClosed = myShop.status === "closed";

	return (
		<div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
			{/* BANNER TRẠNG THÁI */}
			{isShopClosed && (
				<div className="p-6 border-2 border-dashed border-green-400 bg-green-50 rounded-2xl text-center animate-in fade-in">
					<h2 className="text-2xl font-bold text-green-800">
						Cửa hàng đang tạm đóng
					</h2>
					<p className="mt-2 text-green-700 mb-4">
						Khách hàng sẽ không thấy shop của bạn.
					</p>
					<button
						onClick={handleReopenShop}
						disabled={actionLoading}
						className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
						{actionLoading ? "Đang xử lý..." : "Mở lại cửa hàng ngay"}
					</button>
				</div>
			)}

			{/* MAIN CARD PROFILE */}
			<div className="bg-white rounded-2xl shadow-lg overflow-hidden relative group">
				{/* 1. ẢNH BÌA */}
				<div className="relative h-64 bg-gray-200 group/cover">
					<img
						src={buildImageUrl(myShop.coverUrl)}
						alt="Cover"
						className="w-full h-full object-cover"
					/>

					{/* Overlay Upload Cover */}
					{!isShopClosed && (
						<label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer">
							<div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white flex items-center gap-2 hover:bg-white/30 transition">
								<Camera size={24} /> <span>Thay đổi ảnh bìa</span>
							</div>
							<input
								type="file"
								hidden
								accept="image/*"
								onChange={(e) =>
									e.target.files?.[0] &&
									handleImageUpload(e.target.files[0], "cover")
								}
							/>
						</label>
					)}
				</div>

				{/* 2. LOGO & INFO */}
				<div className="px-8 pb-8 relative">
					{/* Logo */}
					<div className="absolute -top-16 left-8 w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden group/logo z-10">
						<img
							src={buildImageUrl(myShop.logoUrl)}
							alt="Logo"
							className="w-full h-full object-cover"
						/>

						{/* Overlay Upload Logo */}
						{!isShopClosed && (
							<label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer">
								<Camera size={24} className="text-white" />
								<input
									type="file"
									hidden
									accept="image/*"
									onChange={(e) =>
										e.target.files?.[0] &&
										handleImageUpload(e.target.files[0], "logo")
									}
								/>
							</label>
						)}
					</div>

					{/* HEADER INFO & EDIT BUTTON */}
					<div className="flex justify-between items-start pt-4 pl-36 min-h-[80px]">
						{!isEditing ? (
							<div>
								<h1 className="text-3xl font-extrabold text-gray-900">
									{myShop.shopName}
								</h1>
								<p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
									<Calendar size={14} /> Tham gia:{" "}
									{formatDate(myShop.createdAt)}
								</p>
							</div>
						) : (
							<div className="flex-1 mr-4">
								{/* Form Edit Shop Name */}
								<input
									{...register("shopName", { required: true })}
									className="text-2xl font-bold border-b-2 border-primary w-full outline-none px-1 py-1"
									placeholder="Nhập tên Shop..."
									autoFocus
								/>
							</div>
						)}

						{/* Action Buttons */}
						{!isShopClosed && (
							<div className="flex gap-2">
								{!isEditing ? (
									<button
										onClick={() => setIsEditing(true)}
										className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
										<Edit2 size={16} /> Chỉnh sửa
									</button>
								) : (
									<>
										<button
											onClick={() => setIsEditing(false)}
											className="p-2 bg-gray-100 hover:bg-red-100 text-red-600 rounded-lg"
											disabled={actionLoading}>
											<X size={20} />
										</button>
										<button
											onClick={handleSubmit(onSubmitInfo)}
											className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-black rounded-lg font-bold shadow-md disabled:opacity-50"
											disabled={actionLoading}>
											{actionLoading ? (
												"Lưu..."
											) : (
												<>
													<Save size={16} /> Lưu thay đổi
												</>
											)}
										</button>
									</>
								)}
							</div>
						)}
					</div>

					{/* DESCRIPTION */}
					<div className="mt-8 pt-6 border-t border-gray-100">
						<h3 className="text-lg font-semibold text-gray-800 mb-3">
							Giới thiệu cửa hàng
						</h3>

						{!isEditing ? (
							<p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
								{myShop.description || (
									<span className="italic text-gray-400">Chưa có mô tả...</span>
								)}
							</p>
						) : (
							<textarea
								{...register("description")}
								rows={5}
								className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none resize-none"
								placeholder="Viết đôi dòng giới thiệu về shop của bạn..."
							/>
						)}
					</div>
				</div>
			</div>

			{/* DANGER ZONE (Giữ nguyên) */}
			{!isShopClosed && (
				<div className="p-6 border-2 border-dashed border-red-200 bg-white rounded-2xl space-y-6">
					<h3 className="text-red-600 font-bold uppercase text-sm tracking-widest mb-4">
						Khu vực nguy hiểm
					</h3>

					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
						<div>
							<h4 className="font-bold text-yellow-800 flex items-center gap-2">
								<EyeOff size={18} /> Tạm đóng cửa hàng
							</h4>
							<p className="text-sm text-yellow-700 mt-1">
								Ẩn shop khỏi khách hàng. Dữ liệu vẫn được giữ nguyên.
							</p>
						</div>
						<button
							onClick={() => setCloseModalOpen(true)}
							className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 font-semibold rounded-lg hover:bg-yellow-100">
							Tạm đóng
						</button>
					</div>

					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
						<div>
							<h4 className="font-bold text-red-800 flex items-center gap-2">
								<ShieldX size={18} /> Xóa vĩnh viễn
							</h4>
							<p className="text-sm text-red-700 mt-1">
								Xóa toàn bộ shop và sản phẩm.{" "}
								<strong className="underline">Không thể hoàn tác.</strong>
							</p>
						</div>
						<button
							onClick={() => setHardDeleteModalOpen(true)}
							className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
							Xóa Shop
						</button>
					</div>
				</div>
			)}

			{/* MODALS */}
			<ConfirmationModal
				isOpen={closeModalOpen}
				onClose={() => setCloseModalOpen(false)}
				onConfirm={handleCloseShop}
				loading={actionLoading}
				title="Xác nhận Tạm đóng"
				description="Shop sẽ bị ẩn. Bạn có chắc chắn?"
				confirmButtonText="Đồng ý đóng"
				variant="warning"
			/>
			<ConfirmationModal
				isOpen={hardDeleteModalOpen}
				onClose={() => setHardDeleteModalOpen(false)}
				onConfirm={handleHardDeleteShop}
				loading={actionLoading}
				title="CẢNH BÁO: XÓA VĨNH VIỄN"
				description="Toàn bộ dữ liệu sẽ mất sạch. Bạn có chắc chắn?"
				confirmButtonText="Xóa vĩnh viễn"
				variant="danger"
			/>
		</div>
	);
}
