"use client";

import React from "react";
import { useAdminNavbar } from "@shared/features/auth";

interface AdminNavbarProps {
	profilePath?: string; // route truyền từ layout
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ profilePath }) => {
	const { userInfo, handleAccountClick } = useAdminNavbar({ profilePath });

	return (
		<nav
			className="flex items-center justify-end gap-6 px-6 py-3
      bg-gradient-to-r from-[#f3f4f6]/80 via-[#faf9f8]/70 to-[#f3f4f6]/80
      backdrop-blur-xl shadow-lg border-b border-white/30 transition-all">
			{/* User Info */}
			<div
				onClick={handleAccountClick}
				className="relative flex items-center gap-3 cursor-pointer group mr-10">
				{/* Avatar với viền gradient glow */}
				<div className="relative w-12 h-12 group">
					<div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 animate-spin-slow border-2 border-transparent">
						<div
							className="w-full h-full rounded-full"
							style={{
								background:
									"conic-gradient(from 0deg, #3b82f6, #ec4899, #a78bfa, #3b82f6)",
							}}
						/>
					</div>
					<div className="relative w-full h-full rounded-full overflow-hidden border border-gray-300 transition-transform duration-300 group-hover:scale-105 z-10">
						{userInfo.avatar ? (
							<img
								src={userInfo.avatar}
								alt={userInfo.name || "avatar"}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold text-sm">
								{userInfo.name?.charAt(0)?.toUpperCase() || "?"}
							</div>
						)}
					</div>
				</div>

				{/* Thông tin người dùng */}
				<div className="hidden sm:flex flex-col items-start relative group z-10">
					{/* Tên người dùng với hiệu ứng hover */}
					<span
						className="font-medium text-gray-800 transition-all duration-300
              group-hover:translate-x-1 group-hover:text-gray-900 group-hover:drop-shadow-sm">
						{userInfo.name || userInfo.username || "Chưa đăng nhập"}
					</span>

					{/* Vai trò người dùng */}
					<span
						className="text-sm text-gray-500 transition-all duration-300
              group-hover:translate-x-1 group-hover:text-gray-700">
						{userInfo.roleLabel}
					</span>
				</div>
			</div>
		</nav>
	);
};
