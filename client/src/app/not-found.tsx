"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
	const router = useRouter();
	const [countdown, setCountdown] = useState(5); // Bắt đầu từ 5 giây

	// Logic đếm ngược và chuyển trang an toàn
	useEffect(() => {
		// Nếu đếm về 0 thì chuyển trang
		if (countdown === 0) {
			router.push("/");
			return;
		}

		// Đếm ngược mỗi giây
		const timer = setTimeout(() => {
			setCountdown((prev) => prev - 1);
		}, 1000);

		// Cleanup timer nếu component bị unmount
		return () => clearTimeout(timer);
	}, [countdown, router]);

	return (
		<div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-800 to-black flex items-center justify-center text-white">
			{/* --- BACKGROUND EFFECTS (Tối ưu hóa để không re-render nặng) --- */}
			<div className="absolute inset-0 bg-[url('/auth_background2.jpg')] opacity-10 bg-cover bg-center pointer-events-none"></div>

			{/* Layer Gradient tĩnh */}
			<div className="absolute inset-0 bg-gradient-radial from-transparent to-black/80 pointer-events-none"></div>

			{/* Glow blobs (Dùng CSS animation thay vì JS) */}
			<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] animate-pulse"></div>
			<div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/30 rounded-full blur-[100px] animate-pulse delay-700"></div>

			{/* --- MAIN CONTENT --- */}
			<div className="relative z-10 text-center flex flex-col items-center px-4 animate-in fade-in zoom-in duration-700">
				{/* Số 404 Khổng lồ */}
				<h1 className="text-[10rem] sm:text-[14rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-2xl tracking-tighter leading-none select-none">
					404
				</h1>

				<h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-2 drop-shadow-md">
					Oops! Không tìm thấy trang
				</h2>

				<p className="text-lg text-gray-300 max-w-md mx-auto">
					Có vẻ như bạn đã đi lạc vào vùng không gian chưa được khai phá.
				</p>

				{/* Countdown Text */}
				<div className="mt-8 py-2 px-6 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
					<p className="text-base text-gray-200">
						Tự động về trang chủ sau{" "}
						<span className="font-bold text-yellow-400 text-xl w-6 inline-block text-center">
							{countdown}
						</span>{" "}
						giây
					</p>
				</div>

				{/* Button về ngay lập tức */}
				<button
					onClick={() => router.push("/")}
					className="mt-8 px-8 py-3 bg-white text-purple-900 font-bold rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 active:scale-95">
					Về trang chủ ngay
				</button>
			</div>
		</div>
	);
}
