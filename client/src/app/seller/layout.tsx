"use client";

import SellerSidebar from "@/components/layouts/SellerSidebar";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <SellerSidebar />
      </aside>

      {/* Nội dung chính */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
