"use client";

import { Search } from "lucide-react";
import React from "react";
import clsx from "clsx";

interface AttributeManagementLayoutProps {
    title?: string;                  // tiêu đề trang
    searchPlaceholder?: string;      // placeholder ô tìm kiếm
    searchValue: string;             // state nhận từ parent
    onSearchChange: (value: string) => void;
    children: React.ReactNode;       // nội dung bảng / form
    className?: string;
}

export function AttributeManagementLayout({
    title = "QUẢN LÝ THUỘC TÍNH",
    searchPlaceholder = "Tìm kiếm thuộc tính...",
    searchValue,
    onSearchChange,
    children,
    className
}: AttributeManagementLayoutProps) {
    return (
        <div className={clsx("w-full", className)}>
        
            {/* ===== Header with Title + Search ===== */}
            <div className="flex items-center justify-between gap-4 mb-6">
                
                {/* Title */}
                <h2 className="text-3xl font-semibold text-gray-700 tracking-tight">
                    {title}
                </h2>

                {/* Search Box */}
                <div className="relative w-[40%] min-w-[250px]">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={22}
                    />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={e => onSearchChange(e.target.value)}
                        className="
                            w-full pl-12 pr-4 py-3 rounded-3xl 
                            border border-gray-300 shadow-lg 
                            placeholder-gray-400 text-sm font-medium 
                            focus:outline-none focus:border-blue-500 
                            focus:ring-4 focus:ring-blue-200 
                            transition-all duration-300
                        "
                    />
                </div>
            </div>

            {/* ===== Content Slot ===== */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-xl p-4">
                {children}
            </div>
        </div>
    );
}
