"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@shared/features/auth/useAuth.hook";
import { Store, User, Package } from "lucide-react";
import clsx from "clsx";
import { tokenUtils } from "@shared/core/utils/auth.utils";

export default function ClientSidebar({ onOpenRegisterModal }) {
	const { user: currentUser, loading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();
	const [showRegisterForm, setShowRegisterForm] = useState(false);
	const [formData, setFormData] = useState({
		shopName: "",
		description: "",
		address: "",
		phone: "",
	});
	const maxLevel = tokenUtils.getMaxLevel();

	if (loading) return <p className="p-4 text-gray-500">Đang tải...</p>;
	if (!currentUser)
		return <p className="p-4 text-red-500">Không lấy được user</p>;

	const canSwitch = maxLevel >= 2; // buyer có quyền chuyển sang seller
	const isBuyer = maxLevel === 1; // thực sự là buyer

	const handleSwitchRole = () => {
		if (isBuyer && !canSwitch) {
			// Buyer chưa đủ quyền → popup
			onOpenRegisterModal();
		} else {
			// Seller/Admin hoặc buyer có quyền → chuyển sang seller
			router.push("/seller/dashboard");
		}
	};

	// Submit đăng ký shop
	const handleRegisterShop = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Form đăng ký shop:", formData);

		// TODO: gọi API đăng ký shop ở đây
		// await api.registerShop(formData);

		setShowRegisterForm(false);
		alert("Đăng ký shop thành công! 🎉");
		router.push("/seller/dashboard");
	};

	const menuItems = [
		{ icon: User, label: "Profile", path: "/user/profile" },
		{ icon: Package, label: "Đơn hàng", path: "/user/orders" },
	];

	return (
		<nav className="bg-bg rounded-xl shadow-md p-4 flex flex-col h-full w-56 relative">
			<div className="flex flex-col gap-2">
				{menuItems.map(({ icon: Icon, label, path }) => {
					const isActive = pathname === path;
					return (
						<div
							key={label}
							onClick={() => router.push(path)}
							className={clsx(
								"flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-300",
								isActive
									? "bg-primary-light text-primary font-semibold shadow-inner"
									: "text-text hover:text-primary hover:bg-primary-light/30"
							)}>
							<Icon
								size={20}
								className={isActive ? "text-primary" : "text-text/70"}
							/>
							<span className="text-sm">{label}</span>
						</div>
					);
				})}
			</div>

			{/* Nút chuyển giao diện luôn hiển thị */}
			<div className="mt-auto border-t border-gray-200 pt-3">
				<button
					onClick={handleSwitchRole}
					className="flex items-center gap-3 px-4 py-2 w-full rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition">
					<Store size={20} />
					Chuyển sang Người bán
				</button>
			</div>
		</nav>
	);
}
