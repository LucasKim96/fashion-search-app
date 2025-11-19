"use client";
import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className,
  ...props
}) => {
  const base = "px-4 py-2 rounded-md font-medium transition-all duration-200";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 hover:bg-red-600",
  };

  return (
    <button
      {...props}
      className={clsx(base, variants[variant], className, {
        "opacity-50 cursor-not-allowed": props.disabled,
      })}
    >
      {children}
    </button>
  );
};
