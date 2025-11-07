// admin/src/app/layout.tsx
import "@/styles/globals.css";
import React from "react";
import { NotificationProvider } from "@shared/core/ui/NotificationProvider";

export const metadata = {
  title: "Fashion Search Admin",
  description: "Trang quản trị hệ thống Fashion Search",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-gray-100 min-h-screen">
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  );
}
