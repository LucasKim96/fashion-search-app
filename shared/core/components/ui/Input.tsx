"use client";
import React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full mb-3">
      {label && (
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        {...props}
        className={clsx(
          "w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-800 placeholder-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
          { "border-red-500": error },
          className
        )}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
