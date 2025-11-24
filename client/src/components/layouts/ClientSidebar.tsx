"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@shared/features/auth/useAuth.hook";
import { Store, User, Package } from "lucide-react";
import clsx from "clsx";

interface ClientSidebarProps {
	onOpenRegisterModal: () => void;
}

export default function ClientSidebar({
	onOpenRegisterModal,
}: ClientSidebarProps) {
	const { user: currentUser, loading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	if (loading) return <p className="p-4 text-gray-500">Đang tải...</p>;
	if (!currentUser)
		return <p className="p-4 text-red-500">Không lấy được user</p>;

	const maxLevel = currentUser.roles?.length
		? Math.max(...currentUser.roles.map((r: any) => r.level))
		: 1; // fallback level 1 nếu không có role

	const isBuyer = maxLevel === 1;

	const handleSwitchRole = () => {
		if (isBuyer) {
			// Buyer chưa có quyền → hiện popup đăng ký shop
			onOpenRegisterModal();
		} else {
			// Seller/Admin → chuyển sang dashboard
			router.push("/seller/dashboard");
		}
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
									? "bg-primary-dark text-primary font-semibold shadow-inner"
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

			{/* Nút chuyển sang seller */}
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
