"use client";
import { NotificationProvider } from "@shared/core/ui/NotificationProvider";
import { Settings, Package, Users, BarChart3 } from "lucide-react";

const shopMenu = [
  { icon: Package, label: "Sản phẩm" },
  { icon: Users, label: "Khách hàng" },
  { icon: BarChart3, label: "Doanh thu" },
  { icon: Settings, label: "Cài đặt shop" },
];

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex bg-gray-100">
        <NotificationProvider>
          <aside className="w-64 bg-white shadow-md flex flex-col p-4">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">Quản lý shop</h2>
            <nav className="flex-1 space-y-2 overflow-y-auto">
              {shopMenu.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </div>
              ))}
            </nav>
          </aside>

          <main className="flex-1 p-6">{children}</main>
        </NotificationProvider>
      </body>
    </html>
  );
}
