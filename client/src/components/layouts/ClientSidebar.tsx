"use client";

import { Home, Shirt, Heart, Settings } from "lucide-react";

const menuItems = [
  { icon: Home, label: "Trang chủ" },
  { icon: Shirt, label: "Thời trang nam" },
  { icon: Heart, label: "Yêu thích" },
  { icon: Settings, label: "Cài đặt" },
];

export default function ClientSidebar() {
  return (
    <nav className="bg-white rounded-xl shadow p-4 space-y-2">
      {menuItems.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition"
        >
          <Icon size={18} />
          <span>{label}</span>
        </div>
      ))}
    </nav>
  );
}
