"use client";

import React from "react";
import { Search } from "lucide-react";
import clsx from "clsx";

interface SearchHeaderProps {
    title: string;
    searchPlaceholder?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    className?: string;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
    title,
    searchPlaceholder = "Tìm kiếm...",
    searchValue,
    onSearchChange,
    className
}) => {
    return (
        <div className={clsx("flex items-center justify-between gap-4 mb-4", className)}>
            {/* Title */}
            <h2 className="text-3xl font-semibold text-gray-700 tracking-tight">
                {title}
            </h2>

            {/* Search Input */}
            <div className="relative w-[40%] min-w-[250px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-3xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-200 shadow-lg transition-all duration-300 placeholder-gray-400 text-sm font-medium"
                />
            </div>
        </div>
    );
};
