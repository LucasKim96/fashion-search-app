"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Store, FileText, Loader2, LucideIcon } from "lucide-react";
import { useAuthContext } from "@shared/features/auth/AuthProvider";
import { createShopApi } from "./shop.api";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import { ImageUploaderWithCrop } from "@/components/forms/ImageUploaderWithCrop";

const FormInput = ({
	icon: Icon,
	...props
}: {
	icon: LucideIcon;
	[key: string]: any;
}) => (
	<div className="relative">
		{/* Icon được đặt tuyệt đối ở bên trái */}
		<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
			<Icon className="text-gray-400" size={20} />
		</div>
		{/* Thẻ input thật */}
		<input
			{...props} // Truyền tất cả các props (type, placeholder, value, onChange, required, ...) vào đây
			className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary transition duration-200"
		/>
	</div>
);

// --- Component con cho Textarea Field ---
// Tương tự như FormInput nhưng dành cho thẻ <textarea>
const FormTextarea = ({
	icon: Icon,
	...props
}: {
	icon: LucideIcon;
	[key: string]: any;
}) => (
	<div className="relative">
		{/* Icon được đặt ở góc trên bên trái */}
		<div className="absolute top-3.5 left-0 pl-4 flex items-center pointer-events-none">
			<Icon className="text-gray-400" size={20} />
		</div>
		<textarea
			{...props} // Truyền tất cả các props (placeholder, value, onChange, rows, required, ...)
			className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary transition duration-200 resize-none"
		/>
	</div>
);

export default function RegisterShopForm({
	onSuccess,
}: {
	onSuccess?: () => void;
}) {
	const router = useRouter();
	const { user, refreshUser } = useAuthContext();
	const { showToast } = useNotification();

	const [shopName, setShopName] = useState("");
	const [description, setDescription] = useState("");
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [coverFile, setCoverFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!shopName.trim()) return showToast("Vui lòng nhập tên shop", "error");
		if (!description.trim())
			return showToast("Vui lòng nhập mô tả shop", "error");
		if (!user?._id)
			return showToast("Không lấy được thông tin người dùng", "error");

		const formData = new FormData();
		formData.append("shopName", shopName.trim());
		formData.append("description", description.trim());
		if (logoFile) formData.append("logo", logoFile);
		if (coverFile) formData.append("cover", coverFile);

		setLoading(true);
		try {
			await createShopApi(formData);
			showToast("Tạo shop thành công!", "success");
			await refreshUser();
			if (onSuccess) onSuccess();
			router.push("/seller/dashboard");
		} catch (err: any) {
			showToast(
				err?.response?.data?.message || err.message || "Lỗi không xác định",
				"error"
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="text-center">
					<h2 className="text-3xl font-bold text-gray-800">
						Trở thành Người bán
					</h2>
					<p className="mt-2 text-gray-500">
						Bắt đầu hành trình kinh doanh của bạn ngay hôm nay.
					</p>
				</div>
				<hr />
				<FormInput
					icon={Store}
					type="text"
					placeholder="Tên cửa hàng của bạn"
					value={shopName}
					onChange={(e) => setShopName(e.target.value)}
					required
				/>

				{/* --- 2. SỬ DỤNG COMPONENT MỚI --- */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<ImageUploaderWithCrop
						label="Logo cửa hàng (Vuông)"
						onFileCropped={setLogoFile} // <-- Cập nhật state file
						aspectRatio={1}
					/>
					<ImageUploaderWithCrop
						label="Ảnh bìa cửa hàng (16:9)"
						onFileCropped={setCoverFile} // <-- Cập nhật state file
						aspectRatio={16 / 9}
					/>
				</div>

				<FormTextarea
					icon={FileText}
					placeholder="Giới thiệu về cửa hàng của bạn..."
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={4}
					required
				/>
				<button
					type="submit"
					className="w-full flex items-center justify-center py-3 bg-primary ... "
					disabled={loading}>
					{loading ? <Loader2 className="animate-spin" /> : "Đăng ký cửa hàng"}
				</button>
			</form>
		</div>
	);
}
