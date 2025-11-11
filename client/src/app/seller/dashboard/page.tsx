"use client";

import { BarChart3, Package, ShoppingBag, Users } from "lucide-react";

export default function SellerDashboardPage() {
  const stats = [
    { icon: BarChart3, label: "Tổng doanh thu", value: "25.600.000₫" },
    { icon: Package, label: "Đơn hàng", value: "124" },
    { icon: ShoppingBag, label: "Sản phẩm", value: "58" },
    { icon: Users, label: "Khách hàng", value: "87" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Bảng điều khiển</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="bg-white rounded-xl shadow p-4 flex flex-col items-start gap-2 hover:shadow-md transition"
          >
            <Icon size={28} className="text-primary" />
            <p className="text-sm text-text/70">{label}</p>
            <p className="text-xl font-semibold text-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6 mt-4 h-64 flex items-center justify-center text-text/60">
        Biểu đồ doanh thu sẽ hiển thị ở đây
      </div>
    </div>
  );
}
