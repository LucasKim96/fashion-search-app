"use client";

import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: LucideIcon; // icon lucide
  iconColor?: string;
  labelColor?: string;
  gradient?: string; // class Tailwind gradient, mặc định giống nút Save
  hoverGradient?: string; // class hover gradient
  roundedFull?: boolean; // bo tròn toàn phần
  shadow?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  icon: Icon,
  iconColor = "text-white",
  labelColor = "text-white",
  gradient = "bg-gradient-to-r from-blue-500 to-purple-600",
  hoverGradient = "hover:from-blue-600 hover:to-purple-700",
  roundedFull = true,
  shadow = true,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        "flex items-center justify-center gap-2 font-medium transition-all duration-200 select-none",
        gradient,
        hoverGradient,
        roundedFull ? "rounded-full" : "rounded-xl",
        shadow && "shadow-lg",
        "px-5 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        "hover:scale-105",
        fullWidth && "w-full",
        disabled && "opacity-70 cursor-not-allowed",
        className
      )}
    >
      {loading && <Loader2 className={clsx("w-5 h-5 animate-spin", iconColor)} />}
      {!loading && Icon && <Icon className={clsx("w-5 h-5", iconColor)} />}
      {label && <span className={clsx("font-medium", labelColor)}>{label}</span>}
    </button>
  );
};
