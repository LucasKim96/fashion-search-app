"use client";
import React from "react";
import { User, LogOut } from "lucide-react";
import { useAdminNavbar } from "@/features/auth/useAdminNavbar.hook";

export const AdminNavbar: React.FC = () => {
  const { user, roleLabel, handleAccountClick} = useAdminNavbar();

  return (
    <nav className="bg-white shadow px-6 py-3 flex items-center justify-end gap-4">
      <div
        onClick={handleAccountClick}
        className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
      >
        <User size={18} />
        <span>
          {user?.username || "Chưa đăng nhập"} ({roleLabel})
        </span>
      </div>
    </nav>
  );
};
