"use client";
import React from "react";

interface AdminMainProps {
  children: React.ReactNode;
}

export const AdminMain: React.FC<AdminMainProps> = ({ children }) => {
  return (
    <main className="flex-1 p-6 overflow-y-auto bg-gray-50 animate-fade-in">
      {children}
    </main>
  );
};
