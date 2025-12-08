import "./globals.css";
import React from "react";
// --- 1. IMPORT CÁC PROVIDER CẦN THIẾT ---
import { NotificationProvider } from "@shared/core/ui/NotificationProvider";
import { AuthProvider } from "@shared/features/auth/AuthProvider";

export const metadata = {
	title: "Nera Luna - Admin",
	description: "Trang quản trị hệ thống Nera Luna",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="vi">
			<body className="bg-gray-100 min-h-screen">
				<div id="toast-root" />
				{/* --- 2. BỌC TOÀN BỘ APP BẰNG CÁC PROVIDER --- */}
				{/* Thứ tự đúng: NotificationProvider ở ngoài, AuthProvider ở trong */}
				<NotificationProvider>
					<AuthProvider>{children}</AuthProvider>
				</NotificationProvider>
			</body>
		</html>
	);
}
