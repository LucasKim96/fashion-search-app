"use client";

import React, { useState } from "react";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";
import ClientSidebar from "@/components/layouts/ClientSidebar";
import RegisterSellerModal from "@/features/shop/RegisterSellerModal";

export default function UserLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// 🟢 State điều khiển hiển thị modal đăng ký shop
	const [showRegisterModal, setShowRegisterModal] = useState(false);

	return (
		<div className="min-h-screen flex flex-col bg-bg text-text">
			<ClientHeader />

			<main className="flex flex-1 px-4 py-6 gap-6">
				{/* Sidebar user */}
				<aside className="w-64 hidden lg:block">
					<ClientSidebar
						onOpenRegisterModal={() => setShowRegisterModal(true)}
					/>
				</aside>

				{/* Content trang user */}
				<section className="flex-1 bg-bg shadow-sm rounded-2xl p-6">
					{children}
				</section>
			</main>

			{/* Modal đăng ký người bán */}
			{showRegisterModal && (
				<RegisterSellerModal onClose={() => setShowRegisterModal(false)} />
			)}

			<ClientFooter />
		</div>
	);
}
