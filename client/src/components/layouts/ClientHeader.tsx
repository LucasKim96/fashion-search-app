"use client";

import { ShoppingCart, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@shared/features/auth/AuthProvider";
import { parseUserProfile, UserProfile } from "@shared/core/utils";
import { SidebarTooltip } from "@shared/core/components/ui/SidebarTooltip";
import { SearchInput } from "@shared/core/components/ui/SearchInput";

const UserInfoDisplay = ({
	userProfile,
	isGuest,
	onAccountClick,
}: {
	userProfile: UserProfile;
	isGuest: boolean;
	onAccountClick: () => void;
}) => {
	return (
		<div className="relative flex items-center gap-3">
			{/* Phần tử Kích hoạt (Trigger) */}
			<div
				onClick={onAccountClick}
				className="flex items-center gap-3 cursor-pointer peer">
				{/* Avatar */}
				<div className="relative w-10 h-10">
					{/* ... Lớp viền gradient ... */}
					{!isGuest && (
						<div className="absolute -inset-0.5 rounded-full opacity-0 peer-hover:opacity-75 transition-opacity duration-300 z-0 animate-spin-slow">
							<div
								className="w-full h-full rounded-full"
								style={{
									background:
										"conic-gradient(from 90deg, #4f46e5, #ec4899, #8b5cf6, #4f46e5)",
								}}
							/>
						</div>
					)}
					{/* ... Lớp avatar chính ... */}
					<div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white bg-gray-200 transition-transform duration-300 peer-hover:scale-105 z-10">
						{userProfile.avatarUrl ? (
							<img
								src={userProfile.avatarUrl}
								alt={userProfile.name || "avatar"}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 font-semibold text-lg">
								{isGuest ? (
									<UserIcon size={20} />
								) : (
									userProfile.name?.charAt(0)?.toUpperCase() || "?"
								)}
							</div>
						)}
					</div>
				</div>

				{/* Thông tin tên và vai trò (chỉ hiển thị khi đã đăng nhập) */}
				{!isGuest && (
					<div className="hidden sm:flex flex-col items-start relative z-10">
						<span className="font-medium text-gray-800 transition-all duration-300 peer-hover:text-primary">
							{userProfile.name || userProfile.username}
						</span>
						<span className="text-sm text-gray-500 transition-all duration-300">
							{userProfile.roleLabel}
						</span>
					</div>
				)}
			</div>

			{/* Tooltip (Là anh em với div có class `peer`) */}
			{isGuest && (
				<SidebarTooltip label="Đăng nhập / Đăng ký" position="left" />
			)}
		</div>
	);
};

interface ClientHeaderProps {
	onMenuClick?: () => void;
}

export default function ClientHeader({ onMenuClick }: ClientHeaderProps) {
	const { user: account, loading, logout } = useAuthContext();
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const [cartCount] = useState(0);
	const [searchValue, setSearchValue] = useState("");

	const handleSearch = () => {
		if (!searchValue.trim()) return;
		router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
	};

	useEffect(() => {
		if (account) {
			setUserProfile(parseUserProfile(account));
		} else {
			setUserProfile({
				accountId: "",
				phoneNumber: "",
				status: "active",
				isBanned: false,
				roles: [],
				avatarUrl: undefined,
				name: "",
				username: "Guest",
				roleLabel: "",
			});
		}
	}, [account]);

	return (
		<header className="w-full bg-white text-gray-800 shadow-sm py-3 px-6 flex items-center justify-between sticky top-0 z-40">
			<div className="flex items-center gap-4">
				{/* <Menu className="w-6 h-6 md:hidden cursor-pointer text-gray-600 hover:text-primary transition" /> */}

				{onMenuClick && (
					<button
						onClick={onMenuClick}
						className="p-2 -ml-2 text-gray-600 lg:hidden">
						<Menu className="w-6 h-6" />
					</button>
				)}
				<div
					className="font-extrabold text-2xl text-primary cursor-pointer"
					onClick={() => router.push("/")}>
					Nera Luna
				</div>
			</div>
			{/* Search */}
			<div className="w-full max-w-lg hidden md:block">
				<SearchInput
					placeholder="Tìm kiếm sản phẩm, thương hiệu..."
					value={searchValue}
					onChange={setSearchValue}
					onEnterPress={handleSearch}
				/>
			</div>
			{/* Action Icons */}
			<div className="flex items-center gap-6">
				{/* Cart Icon */}
				<div
					className="relative cursor-pointer"
					onClick={() => router.push("/user/cart")}>
					<ShoppingCart className="w-6 h-6 text-gray-600 hover:text-primary transition" />
					{cartCount > 0 && (
						<span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
							{cartCount}
						</span>
					)}
				</div>
				{/* User Section */}
				<div ref={dropdownRef} className="relative">
					{loading ? (
						<div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
					) : (
						userProfile && (
							<UserInfoDisplay
								userProfile={userProfile}
								isGuest={!account}
								onAccountClick={() => {
									if (account) {
										setDropdownOpen(!dropdownOpen);
									} else {
										router.push("/login");
									}
								}}
							/>
						)
					)}

					{/* Dropdown Menu */}
					{account && dropdownOpen && (
						<div className="absolute right-0 top-full mt-3 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-fadeIn">
							<button
								onClick={() => {
									setDropdownOpen(false);
									router.push("/user/profile");
								}}
								className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
								<UserIcon size={16} />
								Hồ sơ cá nhân
							</button>
							<button
								onClick={() => {
									setDropdownOpen(false);
									logout?.();
								}}
								className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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
