"use client";
import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Store, Image, FileText } from "lucide-react";
import styles from "./RegisterShopForm.module.css";
import { useAuth } from "@shared/features/auth";
import { createShopApi } from "./shop.api";
import { useNotification } from "@shared/core/ui/NotificationProvider";

interface RegisterShopFormProps {
	onSuccess?: () => void;
}

export default function RegisterShopForm({ onSuccess }: RegisterShopFormProps) {
	const router = useRouter();
	const { user } = useAuth();
	const { showToast } = useNotification();

	const [shopName, setShopName] = useState("");
	const [description, setDescription] = useState("");
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [coverFile, setCoverFile] = useState<File | null>(null);

	// State để xem trước ảnh
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [coverPreview, setCoverPreview] = useState<string | null>(null);

	const [loading, setLoading] = useState(false);

	const handleFileChange = (
		e: ChangeEvent<HTMLInputElement>,
		fileType: "logo" | "cover"
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (fileType === "logo") {
			setLogoFile(file);
			setLogoPreview(URL.createObjectURL(file));
		} else {
			setCoverFile(file);
			setCoverPreview(URL.createObjectURL(file));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Kiểm tra rỗng
		if (!shopName.trim()) return showToast("Vui lòng nhập tên shop", "error");
		if (!description.trim())
			return showToast("Vui lòng nhập mô tả shop", "error");
		// if (!logoFile) return showToast("Vui lòng chọn ảnh logo", "error");
		// if (!coverFile) return showToast("Vui lòng chọn ảnh bìa", "error");
		if (!user?._id)
			return showToast("Không lấy được thông tin người dùng", "error");

		// Tạo FormData
		const formData = new FormData();
		formData.append("shopName", shopName.trim());
		formData.append("description", description.trim());
		if (logoFile) {
			formData.append("logo", logoFile);
		}
		if (coverFile) {
			formData.append("cover", coverFile);
		}

		try {
			setLoading(true);
			await createShopApi(formData);
			showToast("Tạo shop thành công!", "success");
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
		<form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
			<h2 className="text-primary text-3xl font-bold text-center mb-6">
				Đăng ký cửa hàng
			</h2>

			<div className={styles["input-field"]}>
				<input
					type="text"
					placeholder="Tên shop"
					value={shopName}
					onChange={(e) => setShopName(e.target.value)}
				/>
				<Store size={20} />
			</div>

			{/* Input cho Logo */}
			<div className={styles["input-field-file"]}>
				{" "}
				{/* Có thể tạo style riêng */}
				<label htmlFor="logo-upload">Chọn ảnh logo</label>
				<input
					id="logo-upload"
					type="file"
					accept="image/*"
					onChange={(e) => handleFileChange(e, "logo")}
				/>
				<Image size={20} />
			</div>
			{logoPreview && (
				<img
					src={logoPreview}
					alt="Xem trước logo"
					className="w-24 h-24 mt-2 object-cover rounded-full"
				/>
			)}

			{/* Input cho Ảnh bìa */}
			<div className={styles["input-field-file"]}>
				<label htmlFor="cover-upload">Chọn ảnh bìa</label>
				<input
					id="cover-upload"
					type="file"
					accept="image/*"
					onChange={(e) => handleFileChange(e, "cover")}
				/>
				<Image size={20} />
			</div>
			{coverPreview && (
				<img
					src={coverPreview}
					alt="Xem trước ảnh bìa"
					className="w-full h-40 mt-2 object-cover"
				/>
			)}

			<div className={styles["input-field"]}>
				<textarea
					placeholder="Mô tả về shop"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={3}
				/>
				<FileText size={20} />
			</div>

			<button
				type="submit"
				className={styles["submit-button"]}
				disabled={loading}>
				{loading ? "Đang tạo shop..." : "Đăng ký cửa hàng"}
			</button>
		</form>
	);
}
