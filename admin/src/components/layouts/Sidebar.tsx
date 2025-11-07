"use client";
import React from "react";
import clsx from "clsx";
import { useRouter, usePathname } from "next/navigation";
import { adminMenuItems } from "@/constants/adminMenu";

export const AdminSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="w-1/5 bg-white shadow-lg flex flex-col justify-between">
      {/* Logo */}
      <div>
        <div className="p-4 text-xl font-bold text-blue-600 border-b">AdminPanel</div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[80vh]">
          {adminMenuItems.map((item) => (
            <div
              key={item.label}
              onClick={() => router.push(item.path)}
              className={clsx(
                "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all",
                pathname?.startsWith(item.path)
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-blue-50 hover:text-blue-600"
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};
