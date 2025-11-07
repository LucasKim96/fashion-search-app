// client/src/app/page.tsx
"use client";

import React from "react";
import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";
import ClientSidebar from "@/components/layouts/ClientSidebar";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* Header */}
      <ClientHeader />

      {/* Main content */}
      <main className="flex flex-1 w-full max-w-7xl mx-auto px-4 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-1/4 hidden lg:block">
          <ClientSidebar />
        </aside>

        {/* Page content */}
        <section className="flex-1 bg-white shadow-sm rounded-2xl p-6">
          <h1 className="text-3xl font-bold mb-4">Trang chủ FashionSearch</h1>
          <p>
            Chào mừng bạn đến với FashionSearch! Khám phá các sản phẩm thời
            trang mới nhất.
          </p>

          {/* Example grid sản phẩm */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-lg p-4 flex flex-col items-center"
              >
                <div className="w-full h-40 bg-gray-300 rounded-md mb-2"></div>
                <h2 className="text-lg font-medium">Sản phẩm {i + 1}</h2>
                <p className="text-gray-600 mt-1">Giá: 100.000₫</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <ClientFooter />
    </div>
  );
}
