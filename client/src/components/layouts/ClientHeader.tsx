"use client";

import { ShoppingCart, Search, Menu, LogOut, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@shared/features/auth/useAuth.hook";
import {
	parseUserProfile,
	UserProfile,
} from "@shared/core/utils/profile.utils";

export default function ClientHeader() {
	const { user: account, loading, logout } = useAuth();
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const [cartCount] = useState(0);

	useEffect(() => {
		if (account) setUserProfile(parseUserProfile(account));
	}, [account]);

	// Đóng dropdown khi click ra ngoài
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	if (loading) return <p className="p-4 text-gray-500">Đang tải...</p>;
	if (!userProfile)
		return <p className="p-4 text-red-500">Không lấy được thông tin user</p>;

	return (
		<header className="w-full bg-bg text-text shadow-md py-3 px-6 flex items-center justify-between sticky top-0 z-40">
			{/* Logo + Mobile Menu */}
			<div className="flex items-center gap-4">
				<Menu className="w-6 h-6 md:hidden cursor-pointer text-text/80 hover:text-primary transition" />
				<div
					className="font-extrabold text-2xl text-primary cursor-pointer"
					onClick={() => router.push("/")}>
					FashionSearch
				</div>
			</div>

			{/* Search */}
			<div className="relative w-full max-w-lg hidden md:block">
				<input
					type="text"
					placeholder="Tìm sản phẩm..."
					className="w-full border border-border rounded-full py-2 px-4 pl-10 focus:ring-2 focus:ring-primary-light focus:outline-none bg-bg text-text shadow-sm transition"
				/>
				<Search
					size={20}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-text/50"
				/>
			</div>

			{/* Action Icons */}
			<div className="flex items-center gap-4">
				{/* Cart */}
				<div
					className="relative cursor-pointer"
					onClick={() => router.push("/cart")}>
					<ShoppingCart className="w-6 h-6 hover:text-primary transition" />
					{cartCount > 0 && (
						<span className="absolute -top-3 -right-3 bg-primary text-bg text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg z-10">
							{cartCount}
						</span>
					)}
				</div>

				{/* User Avatar + Tên + Dropdown */}
				<div
					ref={dropdownRef}
					className="relative flex items-center gap-2 cursor-pointer">
					{/* Avatar */}
					<div
						className="relative w-10 h-10"
						onClick={() => setDropdownOpen(!dropdownOpen)}>
						<div className="relative w-full h-full rounded-full overflow-hidden border border-gray-300 transition-transform duration-300 hover:scale-105 z-10">
							<img
								src={
									userProfile.avatarUrl || "/assets/avatars/default-avatar.jpg"
								}
								alt={userProfile.name || "avatar"}
								className="w-full h-full object-cover"
							/>
						</div>
					</div>

					{/* Tên user */}
					<span
						onClick={() => setDropdownOpen(!dropdownOpen)}
						className="text-sm font-medium text-gray-700 hover:text-primary transition select-none">
						{account.username || "Người dùng"}
					</span>

					{/* Dropdown */}
					{dropdownOpen && (
						<div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-fadeIn">
							<button
								onClick={() => {
									setDropdownOpen(false);
									router.push("/user/profile");
								}}
								className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
								<User size={16} />
								Hồ sơ cá nhân
							</button>
							<button
								onClick={() => {
									setDropdownOpen(false);
									logout?.();
								}}
								className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
								<LogOut size={16} />
								Đăng xuất
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
