"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Package, User } from "lucide-react";

const menuItems = [
  { icon: User, label: "Profile", path: "/user/profile" },
  { icon: Package, label: "Đơn hàng", path: "/user/orders" },
];

export default function ClientSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="bg-bg rounded-xl shadow-md p-4 flex flex-col gap-2 sticky top-6">
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
    </nav>
  );
}
