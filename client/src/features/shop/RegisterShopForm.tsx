"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Image, FileText } from "lucide-react";
import styles from "./RegisterShopForm.module.css";
import { useAuth } from "@shared/features/auth";
import { createShopApi } from "./shop.api";
import { useNotification } from "@shared/core/ui/NotificationProvider";
import type { CreateShopRequest } from "./shop.types";

interface RegisterShopFormProps {
	onSuccess?: () => void;
}

export default function RegisterShopForm({ onSuccess }: RegisterShopFormProps) {
	const router = useRouter();
	const { user } = useAuth();
	const { showToast } = useNotification();

	const [shopName, setShopName] = useState("");
	const [logoUrl, setLogoUrl] = useState("");
	const [coverUrl, setCoverUrl] = useState("");
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!shopName.trim()) return showToast("Vui lòng nhập tên shop", "error");
		if (!user?._id) return showToast("Không lấy được thông tin user", "error");

		const payload: CreateShopRequest = {
			shopName: shopName.trim(),
			logoUrl: logoUrl.trim(),
			coverUrl: coverUrl.trim(),
			description: description.trim(),
			accountId: user._id,
		};

		try {
			setLoading(true);
			await createShopApi(payload);
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

			<div className={styles["input-field"]}>
				<input
					type="text"
					placeholder="Link ảnh logo"
					value={logoUrl}
					onChange={(e) => setLogoUrl(e.target.value)}
				/>
				<Image size={20} />
			</div>

			<div className={styles["input-field"]}>
				<input
					type="text"
					placeholder="Link ảnh bìa"
					value={coverUrl}
					onChange={(e) => setCoverUrl(e.target.value)}
				/>
				<Image size={20} />
			</div>

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
