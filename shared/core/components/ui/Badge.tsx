"use client";

import React from "react";
import clsx from "clsx";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "secondary" | "success" | "warning" | "error" | "info" | "outline";
    size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
    variant = "default",
    size = "md",
    className,
    children,
    ...props
    }) => {
    const base =
        "inline-flex items-center font-medium rounded-full transition-colors select-none";

    const sizeClass =
        size === "sm"
        ? "px-2 py-[2px] text-xs"
        : "px-3 py-1 text-sm";

    const variants: Record<string, string> = {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-300",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600",
        error: "bg-red-600 text-white hover:bg-red-700",
        info: "bg-cyan-600 text-white hover:bg-cyan-700",
        outline:
        "border border-gray-400 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300",
    };

    return (
        <span
        className={clsx(base, sizeClass, variants[variant], className)}
        {...props}
        >
        {children}
        </span>
    );
};
