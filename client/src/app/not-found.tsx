"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/"); // điều hướng về trang chủ sau 3s
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">404 - Trang không tồn tại</h1>
      <p className="text-gray-500">
        Bạn sẽ được chuyển về trang chủ trong giây lát.
      </p>
      <button
        onClick={() => router.push("/")}
        className="mt-2 px-4 py-2 bg-primary text-bg rounded-lg hover:bg-primary/80 transition"
      >
        Quay về trang chủ
      </button>
    </div>
  );
}
