"use client";

import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "default",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        "relative flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 select-none",
        "px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500": variant === "default",
          "border border-gray-300 hover:bg-gray-50 text-gray-800 focus:ring-gray-400":
            variant === "outline",
          "text-gray-700 hover:bg-gray-100": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500": variant === "danger",
          "opacity-70 cursor-not-allowed": disabled || loading,
          "w-full": fullWidth,
        },
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};
