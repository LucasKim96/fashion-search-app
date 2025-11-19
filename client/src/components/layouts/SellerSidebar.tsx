"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { BarChart, Package, Home, ShoppingBag, ArrowLeft } from "lucide-react";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/seller/dashboard" },
  { icon: ShoppingBag, label: "Sản phẩm", path: "/seller/products" },
  { icon: Package, label: "Đơn hàng", path: "/seller/orders" },
  { icon: BarChart, label: "Thống kê", path: "/seller/analytics" },
];

export default function SellerSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="flex flex-col h-full justify-between">
      {/* Menu trên */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-4 px-2">
          Seller Panel
        </h2>

        {menuItems.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <div
              key={label}
              onClick={() => router.push(path)}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200",
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

      {/* Nút dưới */}
      <div className="mt-auto border-t border-gray-200 pt-3">
        <button
          onClick={() => router.push("/user/profile")}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition"
        >
          <ArrowLeft size={20} />
          Quay lại giao diện Người mua
        </button>
      </div>
    </nav>
  );
}
