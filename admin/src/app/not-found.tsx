"use client";


import React , {useState} from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export default function NotFoundPage() {
  const router = useRouter();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-purple-800 via-indigo-700 to-pink-600 flex items-center justify-center text-white"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* Dynamic background layers */}
      <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-white/5 pointer-events-none animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-gradient-conic from-pink-400 via-purple-600 to-indigo-500 opacity-20 pointer-events-none animate-spin-slower"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>

      {/* Glow / neon blobs */}
      <div className="absolute -bottom-40 -right-40 w-[300px] h-[300px] bg-pink-500 rounded-full opacity-40 blur-3xl animate-pulse-slow"></div>
      <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-purple-500 rounded-full opacity-40 blur-3xl animate-pulse-slow"></div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent)]"></div>

      {/* Main content */}
      <div className="relative z-10 text-center flex flex-col items-center gap-2 px-4">
        {/* 404 chữ lớn VIP, dịu mắt */}
        <h1 className="relative text-[14rem] sm:text-[16rem] font-extrabold text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] animate-bounce-slow">
          {/* Layer glitch dịu mắt */}
          <span className="absolute text-pink-300 left-1 top-0 blur-sm animate-[glitch1_1s_infinite]">404</span>
          <span className="absolute text-indigo-200 left-[-2px] top-1 blur-sm animate-[glitch2_1s_infinite]">404</span>
          404
        </h1>

        <p className="text-3xl sm:text-4xl font-semibold text-white/90 drop-shadow-md">
          Oops! Trang bạn tìm kiếm không tồn tại.
        </p>

        {/* Interactive Button */}
        <button
          onClick={() => router.push("/admin/dashboard")}
          className={clsx(
            "relative mt-6 px-10 py-3 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 text-white font-bold text-lg shadow-xl overflow-hidden",
            "transition-all duration-300 transform hover:scale-110 hover:shadow-[0_0_35px_rgba(255,255,255,0.7),0_0_60px_rgba(255,255,255,0.5)]"
          )}
        >
          <span
            className="absolute w-72 h-72 rounded-full bg-white opacity-20 pointer-events-none"
            style={{
              transform: `translate(${(mousePos.x - 500)/ 10}px, ${(mousePos.x - 400)/ 10}px)`,
            }}
          />
          Quay về trang chủ
        </button>
      </div>

    <style jsx>{`
      @keyframes glitch1 {
        0% { transform: translate(0, 0); opacity: 1; }
        20% { transform: translate(-4px, 2px); opacity: 0.85; }
        40% { transform: translate(3px, -2px); opacity: 0.9; }
        60% { transform: translate(-3px, 1px); opacity: 0.88; }
        80% { transform: translate(2px, -1px); opacity: 0.9; }
        100% { transform: translate(0, 0); opacity: 1; }
      }
      @keyframes glitch2 {
        0% { transform: translate(0, 0); opacity: 1; }
        20% { transform: translate(3px, -1px); opacity: 0.85; }
        40% { transform: translate(-3px, 2px); opacity: 0.9; }
        60% { transform: translate(2px, -1px); opacity: 0.9; }
        80% { transform: translate(-2px, 1px); opacity: 0.88; }
        100% { transform: translate(0, 0); opacity: 1; }
      }

      /* Bounce chậm cho 404 */
      @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-25px); } /* Nảy mạnh hơn một chút */
      }
      .animate-bounce-slow {
        animation: bounce-slow 1.5s ease-in-out infinite;
      }
    `}</style>
    </div>
  );
}
