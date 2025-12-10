"use client";

import React, { useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";
import ClientSidebar from "@/components/layouts/ClientSidebar";
import RegisterSellerModal from "@/features/shop/RegisterSellerModal";
import clsx from "clsx";

// Cài đặt nếu chưa có: npm install react-responsive

export default function UserLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [showRegisterModal, setShowRegisterModal] = useState(false);
	// --- 1. THÊM STATE ĐỂ QUẢN LÝ SIDEBAR ---
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	// Tự động điều chỉnh sidebar dựa trên kích thước màn hình
	const isDesktop = useMediaQuery({ query: "(min-width: 1024px)" }); // lg breakpoint

	useEffect(() => {
		// Trên desktop, luôn mở sidebar
		if (isDesktop) {
			setIsSidebarOpen(true);
		} else {
			// Trên mobile/tablet, mặc định đóng
			setIsSidebarOpen(false);
		}
	}, [isDesktop]);

	return (
		<div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
			{/* --- 2. TRUYỀN HÀM TOGGLE VÀO HEADER --- */}
			<ClientHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

			<main className="flex flex-1 container mx-auto px-4 py-6 gap-6">
				{/* === SIDEBAR === */}
				{/* 
                  - Luôn render sidebar để có hiệu ứng trượt.
                  - Dùng `clsx` và `translate` để điều khiển ẩn/hiện.
                */}
				<aside
					className={clsx(
						"fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:relative lg:shadow-none lg:translate-x-0",
						{
							"translate-x-0": isSidebarOpen, // Hiện
							"-translate-x-full": !isSidebarOpen, // Ẩn
						}
					)}>
					<ClientSidebar
						onOpenRegisterModal={() => {
							setShowRegisterModal(true);
							setIsSidebarOpen(false); // Tự động đóng sidebar khi mở modal
						}}
					/>
				</aside>

				{/* Lớp phủ đen mờ khi mở sidebar trên mobile */}
				{!isDesktop && isSidebarOpen && (
					<div
						onClick={() => setIsSidebarOpen(false)}
						className="fixed inset-0 bg-black/40 z-30 lg:hidden"
					/>
				)}

				{/* Content trang user */}
				<section className="flex-1 w-full p-6">{children}</section>
			</main>

			{showRegisterModal && (
				<RegisterSellerModal onClose={() => setShowRegisterModal(false)} />
			)}
			<ClientFooter />
		</div>
	);
}
