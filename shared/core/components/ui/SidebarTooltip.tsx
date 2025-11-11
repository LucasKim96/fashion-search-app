"use client";

import React from "react";
import clsx from "clsx";

interface SidebarTooltipProps {
    label: string;
}

/**
 * Tooltip hiển thị khi sidebar bị thu gọn
 */
export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label }) => {
    return (
        <div
        className={clsx(
            "absolute left-full top-1/2 -translate-y-1/2 ml-3",
            "px-3 py-2 bg-gradient-to-r from-gray-900/95 to-gray-800/90",
            "text-white text-xs font-medium rounded-lg",
            "opacity-0 group-hover:opacity-100 group-hover:translate-x-1",
            "shadow-lg backdrop-blur-sm transition-all duration-300",
            "whitespace-nowrap z-50"
        )}
        >
        {label}

        <span
            className={clsx(
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2",
            "rotate-45 bg-gradient-to-tr from-white/90 to-gray-200/90",
            "shadow-[2px_2px_6px_rgba(0,0,0,0.25)]",
            "border border-white/30 rounded-sm"
            )}
        />
        </div>
    );
};
