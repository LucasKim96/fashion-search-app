"use client";

import React from "react";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";
import ClientSidebar from "@/components/layouts/ClientSidebar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <ClientHeader />

      <main className="flex flex-1 px-4 py-6 gap-6">
        {/* Sidebar user */}
        <aside className="w-64 hidden lg:block">
          <ClientSidebar />
        </aside>

        {/* Content trang user */}
        <section className="flex-1 bg-bg shadow-sm rounded-2xl p-6">
          {children}
        </section>
      </main>

      <ClientFooter />
    </div>
  );
}
