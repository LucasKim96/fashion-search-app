// admin/src/app/layout.tsx
import "./globals.css";
import React from "react";
import { NotificationProvider } from "@shared/core/ui/NotificationProvider";

export const metadata = {
  title: "Fashion Search Admin",
  description: "Trang quản trị hệ thống Fashion Search",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-gray-100 min-h-screen">
        {/* Container toast luôn ở ngoài NotificationProvider */}
        <div id="toast-root" />
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
    // <html lang="vi">
    //   <body className="bg-gray-100 ">
    //     <NotificationProvider>{children}</NotificationProvider>
    //   </body>
    // </html>

// min-h-screen