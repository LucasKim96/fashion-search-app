"use client";

import React from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
        {children}
      </body>
    </html>
  );
}
