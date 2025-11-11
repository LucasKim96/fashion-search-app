"use client";

import React from "react";
import { AdminSidebar } from "@/components/layouts/Sidebar";
import { AdminNavbar } from "@/components/layouts/Navbar";
import { AdminMain } from "@/components/layouts/Main";
import { NotificationProvider } from "@shared/core/ui/NotificationProvider";
import { ProtectedRoute } from "@shared/features/auth/ProtectedRoute";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      {/* Bảo vệ toàn bộ khu vực admin */}
      <ProtectedRoute requiredRole={["ADMIN", "SUPER_ADMIN"]} redirectTo="/admin/login">
        <div className="flex min-h-screen bg-gray-100">
          <AdminSidebar />
          {/* <section className="flex-1 flex flex-col"> */}
          <section className="flex-1 flex flex-col transition-all duration-300">
            <AdminNavbar />
            <AdminMain>{children}</AdminMain>
          </section>
        </div>
      </ProtectedRoute>
    </NotificationProvider>
  );
}
