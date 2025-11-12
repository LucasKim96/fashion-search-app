"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Package, User, Store } from "lucide-react";
import { useState, useEffect } from "react";

const menuItems = [
  { icon: User, label: "Profile", path: "/user/profile" },
  { icon: Package, label: "Đơn hàng", path: "/user/orders" },
];

export default function ClientSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [currentRole, setCurrentRole] = useState<"buyer" | "seller" | null>(null);
  const [loading, setLoading] = useState(true);

  // 🪝 Lấy role từ DB
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("/api/auth/role");
        const data = await res.json();
        setCurrentRole(data.role);
      } catch (error) {
        console.error("Không thể lấy role:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  const handleSwitchRole = async () => {
    if (!currentRole) return;

    const newRole = currentRole === "buyer" ? "seller" : "buyer";
    setCurrentRole(newRole);

    // có thể gọi API cập nhật role vào DB
    await fetch("/api/auth/role", {
      method: "POST",
      body: JSON.stringify({ role: newRole }),
      headers: { "Content-Type": "application/json" },
    });

    // chuyển trang phù hợp
    router.push(
      newRole === "buyer" ? "/user/profile" : "/seller/dashboard"
    );
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Đang tải...</div>;
  }

  return (
    <nav className="bg-bg rounded-xl shadow-md p-4 flex flex-col h-full w-56">
      {/* Phần menu trên */}
      <div className="flex flex-col gap-2">
        {menuItems.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <div
              key={label}
              onClick={() => router.push(path)}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-300",
                isActive
                  ? "bg-primary-light text-primary font-semibold shadow-inner"
                  : "text-text hover:text-primary hover:bg-primary-light/30"
              )}
            >
              <Icon
                size={20}
                className={clsx(isActive ? "text-primary" : "text-text/70")}
              />
              <span className="text-sm">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Nút chuyển role dưới cùng */}
      <div className="mt-auto border-t border-gray-200 pt-3">
        <button
          onClick={handleSwitchRole}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition"
        >
          <Store size={20} />
          {currentRole === "buyer"
            ? "Chuyển sang Người bán"
            : "Chuyển sang Người mua"}
        </button>
      </div>
    </nav>
  );
}
