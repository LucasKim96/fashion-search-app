"use client";
import React from "react";
import clsx from "clsx";

interface AdminMainProps {
  children: React.ReactNode;
}

export const AdminMain: React.FC<AdminMainProps> = ({ children }) => {
  return (
    <main
      className={clsx(
        "flex-1 min-h-full overflow-hidden",
        "bg-gradient-to-br from-[#f9f9f8] via-[#f5f4f3] to-[#eceae9]",
        "px-6 md:px-8 py-6 animate-fade-in transition-all duration-500"
      )}
    >
      {/* Khung glassmorphism */}
      <div className="relative min-h-full p-4 md:p-6">
        <div
          className={clsx(
            "absolute inset-0 rounded-3xl bg-white/60",
            "backdrop-blur-lg border border-white/40 shadow-lg pointer-events-none z-0"
          )}
        ></div>

        {/* Nội dung chính */}
        <div className="relative z-10 min-h-full flex flex-col gap-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/60 scrollbar-track-transparent rounded-2xl">
          {children}
        </div>
      </div>
    </main>
  );
};
