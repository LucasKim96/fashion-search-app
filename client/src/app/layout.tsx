"use client";

import React from "react";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";
import ClientSidebar from "@/components/layouts/ClientSidebar";
import { NotificationProvider } from "@shared/core/ui/NotificationProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
        <NotificationProvider>
          <ClientHeader />
          <main className="flex flex-1 w-full max-w-7xl mx-auto px-4 py-6 gap-6">
            <aside className="w-1/4 hidden lg:block">
              <ClientSidebar />
            </aside>
            <section className="flex-1 bg-white shadow-sm rounded-2xl p-6">
              {children}
            </section>
          </main>
          <ClientFooter />
        </NotificationProvider>
      </body>
    </html>
  );
}
