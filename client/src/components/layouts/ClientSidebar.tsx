"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@shared/features/auth/useAuth.hook"; // ✅ import hook đúng
import { Store, User, Package } from "lucide-react";
import clsx from "clsx";

export default function ClientSidebar() {
  // ✅ Lấy user (currentUser) và loading từ hook useAuth
  const { user: currentUser, loading } = useAuth();

  const router = useRouter();
  const pathname = usePathname();

  if (loading) return <p className="p-4 text-gray-500">Đang tải...</p>;
  if (!currentUser) return <p className="p-4 text-red-500">Không lấy được user</p>;

const handleSwitchRole = () => {
  const isBuyer = currentUser.roles?.some(r => r.roleName === "Khách hàng");
  const isSeller = currentUser.roles?.some(r => r.roleName === "Chủ shop");

  if (isBuyer) router.push("/seller/dashboard");
  else if (isSeller) router.push("/user/profile");
};

  const menuItems = [
    { icon: User, label: "Profile", path: "/user/profile" },
    { icon: Package, label: "Đơn hàng", path: "/user/orders" },
  ];

  return (
    <nav className="bg-bg rounded-xl shadow-md p-4 flex flex-col h-full w-56">
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
              <Icon size={20} className={isActive ? "text-primary" : "text-text/70"} />
              <span className="text-sm">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-auto border-t border-gray-200 pt-3">
        <button
          onClick={handleSwitchRole}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition"
        >
          <Store size={20} />
          {currentUser.roles?.some(r => r.roleName === "Khách hàng")
            ? "Chuyển sang Người bán"
            : "Chuyển sang Người mua"}
        </button>
      </div>
    </nav>
  );
}
