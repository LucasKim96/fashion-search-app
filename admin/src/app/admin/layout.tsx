"use client";

import React from "react";
// --- 1. XÓA BỎ IMPORT NotificationProvider ---
import { AdminSidebar, AdminNavbar, AdminMain } from "@shared/core";
import { ProtectedRoute } from "@shared/features/auth";
import { adminMenuItems } from "@/constants/adminMenu";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		// --- 2. XÓA BỎ HOÀN TOÀN Thẻ <NotificationProvider> ---
		// ProtectedRoute bây giờ sẽ tự động tìm thấy AuthProvider từ RootLayout
		<ProtectedRoute requiredRole={["ADMIN", "SUPER_ADMIN"]} redirectTo="/login">
			<div className="grid grid-cols-[auto,1fr] h-screen overflow-hidden bg-gray-100">
				{/* Sidebar */}
				<div className="sticky top-0 h-screen z-30">
					<AdminSidebar menuItems={adminMenuItems} />
				</div>

				{/* Phần nội dung */}
				<div className="flex flex-col h-screen relative z-10">
					<div className="sticky top-0 z-20">
						<AdminNavbar profilePath="/admin/profile" />
					</div>
					<div className="flex-1 overflow-y-auto">
						<AdminMain>{children}</AdminMain>
					</div>
				</div>
			</div>
		</ProtectedRoute>
	);
}
