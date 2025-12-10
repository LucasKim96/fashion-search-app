"use client";

import {
	ShoppingCart,
	Menu,
	LogOut,
	User as UserIcon,
	Search,
	Package,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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
	const pathname = usePathname(); // 2. Lấy đường dẫn hiện tại

	const [cartCount] = useState(0);
	const [searchValue, setSearchValue] = useState("");

	// Kiểm tra xem có đang ở trang search-text không
	const isSearchPage = pathname === "/search-text";

	const handleSearch = () => {
		if (!searchValue.trim()) return;
		router.push(`/search-text?q=${encodeURIComponent(searchValue.trim())}`);
	};

	const handleCameraSearch = () => {
		router.push("/search-image"); // Nếu bạn chưa có trang này thì để tạm
	};

	useEffect(() => {
		if (account) {
			setUserProfile(parseUserProfile(account));
		} else {
			setUserProfile({
				/*...*/
			} as UserProfile); // (Giữ nguyên logic cũ của bạn)
		}
	}, [account]);

	return (
		<header className="w-full bg-white text-gray-800 shadow-sm py-3 px-6 flex items-center justify-between sticky top-0 z-40 h-20">
			{/* LEFT: Logo & Menu */}
			<div className="flex items-center gap-4">
				{onMenuClick && (
					<button
						onClick={onMenuClick}
						className="p-2 -ml-2 text-gray-600 lg:hidden">
						<Menu className="w-6 h-6" />
					</button>
				)}
				<div
					className="font-extrabold text-2xl text-primary cursor-pointer tracking-tighter"
					onClick={() => router.push("/")}>
					Nera Luna
				</div>
			</div>

			{/* CENTER: Search Input (Chỉ hiện nếu KHÔNG PHẢI trang search) */}
			{/* Hoặc hiện một nút kính lúp nhỏ để dẫn sang trang search nếu muốn gọn */}
			<div className="flex-1 max-w-2xl px-8 hidden md:block">
				{!isSearchPage ? (
					<SearchInput
						placeholder="Tìm kiếm sản phẩm, thương hiệu..."
						value={searchValue}
						onChange={setSearchValue}
						onEnterPress={handleSearch}
						onCameraClick={handleCameraSearch}
					/>
				) : (
					// Nếu đang ở trang search, có thể để trống hoặc hiện một text gì đó
					<div className="h-10 w-full"></div>
				)}
			</div>

			{/* RIGHT: Actions */}
			<div className="flex items-center gap-4 md:gap-6">
				{/* Mobile Search Icon (Chỉ hiện trên mobile) */}
				{!isSearchPage && (
					<button
						onClick={() => router.push("/search-text")}
						className="md:hidden p-2 text-gray-600 hover:text-primary">
						<Search size={24} />
					</button>
				)}

				{/* Cart Icon */}
				<div
					className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
					onClick={() => router.push("/user/cart")}>
					<ShoppingCart className="w-6 h-6 text-gray-600 hover:text-primary transition" />
					{cartCount > 0 && (
						<span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
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
									if (account) setDropdownOpen(!dropdownOpen);
									else router.push("/login");
								}}
							/>
						)
					)}

					{/* Dropdown Menu (Giữ nguyên) */}
					{account && dropdownOpen && (
						<div className="absolute right-0 top-full mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
							{/* Header User Info Mobile */}
							<div className="px-4 py-3 border-b border-gray-100 md:hidden">
								<p className="font-bold text-gray-900 truncate">
									{userProfile?.name}
								</p>
								<p className="text-xs text-gray-500 truncate">
									{userProfile?.username}
								</p>
							</div>

							<button
								onClick={() => {
									setDropdownOpen(false);
									router.push("/user/profile");
								}}
								className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
								<UserIcon size={18} /> Hồ sơ cá nhân
							</button>

							<button
								onClick={() => {
									setDropdownOpen(false);
									router.push("/user/orders");
								}}
								className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
								<Package size={18} /> Đơn mua
							</button>

							<div className="my-1 border-t border-gray-100"></div>

							<button
								onClick={() => {
									setDropdownOpen(false);
									logout?.();
								}}
								className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">
								<LogOut size={18} /> Đăng xuất
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
