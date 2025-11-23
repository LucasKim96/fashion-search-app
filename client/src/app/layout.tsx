// client/src/app/layout.tsx
import "./globals.css";
import React from "react";
import { NotificationProvider } from "@shared/core/ui/NotificationProvider";
import { AuthProvider } from "@shared/features/auth/AuthProvider";

export const metadata = {
	title: "Nera Luna - Thương mại điện tử thời trang",
	description: "Trang khách hàng của thương mại điện tử Nera Luna",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="vi">
			<body>
				<div id="toast-root" />
				{/* --- SỬA LẠI THỨ TỰ Ở ĐÂY --- */}
				{/* Provider nào cung cấp "dịch vụ" cho provider khác thì phải được đặt ở ngoài */}
				<NotificationProvider>
					<AuthProvider>{children}</AuthProvider>
				</NotificationProvider>
				{/* --- KẾT THÚC PHẦN SỬA --- */}
			</body>
		</html>
	);
}
