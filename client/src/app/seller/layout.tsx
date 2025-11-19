"use client";

import React from "react";
import { AdminSidebar, AdminNavbar, AdminMain, NotificationProvider} from "@shared/core";
import { ProtectedRoute } from "@shared/features/auth";
import { shopMenuItems } from "@/constants/shopMenu";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <ProtectedRoute requiredRole={["SHOP_OWNER"]} redirectTo="/">
        {/* Bố cục chia 2 cột: sidebar + phần nội dung */}
        <div className="grid grid-cols-[auto,1fr] h-screen overflow-hidden bg-gray-100">
          {/* Sidebar cố định */}
          <div className="sticky top-0 h-screen z-30">
            <AdminSidebar menuItems={shopMenuItems} isShop={true}  />
          </div>

          {/* Phần bên phải: Navbar cố định, Main cuộn */}
          <div className="flex flex-col h-screen relative z-10">
            {/* Navbar cố định */}
            <div className="sticky top-0 z-20">
              <AdminNavbar profilePath="/seller/profile"/>
            </div>

            {/* Main: phần duy nhất có thể cuộn */}
            <div className="flex-1 overflow-y-auto">
              <AdminMain>{children}</AdminMain>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </NotificationProvider>
  );
}
