"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Package, User, Store } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: User, label: "Profile", path: "/user/profile" },
  { icon: Package, label: "Đơn hàng", path: "/user/orders" },
];

export default function ClientSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  // Giả lập role (sau này lấy từ store hoặc context)
  const [currentRole, setCurrentRole] = useState<"buyer" | "seller">("buyer");

  const handleSwitchRole = () => {
    if (currentRole === "buyer") {
      setCurrentRole("seller");
      router.push("/seller/dashboard"); // route đến giao diện người bán
    } else {
      setCurrentRole("buyer");
      router.push("/user/profile"); // quay lại buyer
    }
  };

  return (
    <nav className="bg-bg rounded-xl shadow-md p-4 flex flex-col gap-2 sticky top-6 w-56">
      {/* Menu chính */}
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

      {/* Divider */}
      <div className="border-t border-gray-200 my-3" />

      {/* Nút chuyển role */}
      <button
        onClick={handleSwitchRole}
        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200 transition"
      >
        <Store size={20} />
        {currentRole === "buyer"
          ? "Chuyển sang Người bán"
          : "Chuyển sang Người mua"}
      </button>
    </nav>
  );
}
