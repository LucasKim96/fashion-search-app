"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { useRouter, usePathname } from "next/navigation";
import { adminMenuItems } from "@/constants/adminMenu";
import { ChevronLeft, ChevronRight, SquareDot, LogOut } from "lucide-react";
import { SidebarTooltip } from "@shared/core/components/ui";
import { useAdminNavbar } from "@/features/auth/useAdminNavbar.hook";

export const AdminSidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { handleLogout } = useAdminNavbar();

  return (
    <aside
      className={clsx(
        // Glass blur + ánh sáng nhẹ, tone trung tính
        "relative flex flex-col border-r border-white/30 shadow-2xl backdrop-blur-2xl transition-all duration-500",
        // Gradient tinh chỉnh: sáng trên, đậm dưới
        "bg-gradient-to-t from-[#cfc9c3]/95 via-[#e4e0dc]/95 to-[#faf9f8]/95 text-gray-800",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Dải sáng bên phải */}
      <div className="absolute inset-y-0 right-0 w-px bg-white/40" />

      {/* Logo */}
      <div className="flex flex-col items-center border-b border-white/40 p-4">
        <img
          src={collapsed ? "/logo-small.png" : "/logo-full.jpg"}
          alt="Admin Logo"
          className={clsx(
            "transition-all duration-300 drop-shadow-sm",
            collapsed ? "w-9 h-9" : "w-36 h-auto"
          )}
        />
      </div>

      {/* Nút thu gọn */}
      <div className="flex justify-center mt-3">
        <button
          className={clsx(
            "relative p-2 rounded-full transition-all duration-500 backdrop-blur-md",
            "bg-gradient-to-br from-white/80 via-white/50 to-white/30", // gradient đậm hơn
            "text-gray-700 shadow-inner shadow-gray-400/50 border border-white/40", // shadow đậm hơn
            "hover:bg-gradient-to-br hover:from-white/90 hover:to-[#f3ebe6]/90",
            "hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:scale-110 active:scale-95"
          )}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          <span className="relative z-10">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </span>
          {/* Vòng sáng mềm */}
          <span className="absolute inset-0 rounded-full bg-white/30 opacity-0 hover:opacity-100 blur-lg transition-all duration-500 pointer-events-none"></span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-visible mt-4">
        {adminMenuItems.map((item) => {
          // const itemRef = React.createRef<HTMLDivElement>();
          const isActive = pathname?.startsWith(item.path);
          return (
            <div
              key={item.label}
              // ref={itemRef}
              onClick={() => router.push(item.path)}
              className={clsx(
                  "relative flex items-center gap-3 p-2.5 rounded-full cursor-pointer transition-all duration-500 group select-none",
                  collapsed ? "justify-center" : "justify-start",
                  isActive
                    ? "bg-white/70 text-gray-900 font-semibold shadow-md"
                    : "text-gray-700 hover:text-gray-900"
                )}

            >
              {/* Icon */}
              <item.icon
                size={20}
                className={clsx(
                  "flex-shrink-0 transition-transform duration-300 group-hover:scale-110 z-20",
                  collapsed ? "ml-0" : "ml-3",
                  item.color ? item.color : isActive ? "text-gray-900" : "text-gray-600"
                )}
              />

              {/* Label */}
              {!collapsed && (
                <span className="ml-1 text-sm tracking-wide group-hover:translate-x-1 transition-transform duration-300 z-20">
                  {item.label}
                </span>
              )}
              {/* <span
                className={clsx(
                  "absolute left-0 top-0 bottom-0 z-20",
                  "scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top",
                  isActive ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
                )}
                style={{
                  width: "100%",
                  background:
                    "linear-gradient(to right, rgba(0, 0, 0, 0.7) 15px, transparent 10px)", 
                  borderRadius: "9999px",
                }}
              ></span> */}

              {/* Hiệu ứng ánh sáng trắng dịu hơn */}
              <span
                className={clsx(
                  "absolute inset-0 rounded-full z-10 pointer-events-none",
                  "transition-all duration-300",
                  isActive
                    ? "bg-white/70 shadow-md border border-white/90"
                    : ["group-hover:border group-hover:border-white/90",
                        "group-hover:[background-image:linear-gradient(to_top_right,rgba(255,255,255,0.8),rgba(240,240,240,0.5))]",
                        "group-hover:[box-shadow:inset_0_2px_4px_rgba(0,0,0,0.1),_0_5px_10px_rgba(0,0,0,0.1)]"
                      ]
                )}
              >
              </span>
              {/* Hiển thị label khi rê chuột */}
              {collapsed && <SidebarTooltip label={item.label} />}
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="border-t border-white/50 p-3 backdrop-blur-md">
        <div
          onClick={handleLogout}
          className={clsx(
            "relative flex items-center gap-3 p-2.5 rounded-full cursor-pointer transition-all duration-500 group select-none shadow-md",
            collapsed ? "justify-center" : "justify-start",
            // Nền đỏ gradient giữ nguyên
            "bg-gradient-to-r from-red-500/90 to-red-600/90 text-white",
            // Hiệu ứng hover
            "hover:from-red-400 hover:to-red-500 hover:shadow-lg active:scale-95"
          )}
        >
          {/* Icon */}
          <LogOut
            size={20}
            className= {clsx(
              "flex-shrink-0 transition-transform duration-300 group-hover:scale-110 z-20",
              collapsed ? "ml-0" : "ml-3",
            )}
          />

          {/* Label */}
          {!collapsed && (
            <span className="ml-1 text-sm tracking-wide group-hover:translate-x-1 transition-transform duration-300 z-20">
              Đăng xuất
            </span>
          )}

          {/* Hiệu ứng ánh sáng mờ lan dần khi hover */}
          <span
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100
              transition-all duration-500 pointer-events-none z-10
              bg-gradient-to-r from-white/10 via-white/10 to-transparent"
          ></span>

          {/* Tooltip khi thu gọn */}
          {collapsed && <SidebarTooltip label="Đăng xuất" />}
        </div>
      </div>
    </aside>
  );
};

              {/* Hiệu ứng ánh sáng trắng dịu hơn */}
              {/* <span
                className={clsx(
                  "absolute inset-0 rounded-full z-10 pointer-events-none",
                  "transition-all duration-300",
                  // Hiệu ứng khi active
                  isActive
                    ? "bg-white/70 shadow-md border border-white/90"
                    // Hiệu ứng khi hover: Border/Shadow mềm mại hơn
                    : "group-hover:bg-gray-100/50 group-hover:shadow-inner group-hover:shadow-gray-300/50 group-hover:border group-hover:border-white/70"
                )}
              ></span> */}

{/* <span
    className={clsx(
        "absolute left-0",
        // CHỈNH SỬA: Đưa về top-0 bottom-0 để viền có chiều cao bằng item
        "top-0 bottom-0", 
        // CHỈNH SỬA: Tăng độ rộng lên w-1.5 hoặc w-2 và tăng độ sáng lên bg-white/90
        "w-1.5 bg-white/90 shadow-lg", 
        // CHỈNH SỬA: Dùng rounded-l-xl để khớp với bo góc của div item (rounded-xl)
        "rounded-l-xl", 
        // Thêm z-20 để đảm bảo nó hiển thị trên hiệu ứng hover mờ
        "z-20", 
        "scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top",
        isActive && "scale-y-100"
    )}
></span> */}
{/* <span
    className={clsx(
        "absolute left-0 top-0 bottom-0",
        // Bắt buộc: Tăng độ rộng lên w-2 hoặc w-1.5 để bao phủ góc
        "w-2 bg-white/90 shadow-lg", 
        // Bắt buộc: Sử dụng rounded-l-full để bo cong hoàn toàn bên trái, khớp với nút
        "rounded-l-full", 
        "z-20", 
        "scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top",
        isActive && "scale-y-100"
    )}
></span> */}