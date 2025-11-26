// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import clsx from "clsx";

// export default function NotFoundPage() {
// 	const router = useRouter();
// 	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
// 	const [countdown, setCountdown] = useState(4);

// 	useEffect(() => {
// 		// Tạo một interval chạy mỗi giây để cập nhật bộ đếm
// 		const interval = setInterval(() => {
// 			setCountdown((prevCount) => prevCount - 1);
// 		}, 1000);

// 		// Tạo một timeout để chuyển hướng sau 5 giây
// 		const timeout = setTimeout(() => {
// 			router.push("/");
// 		}, 4000);

// 		// Hàm dọn dẹp: Rất quan trọng!
// 		// Nó sẽ được gọi khi component unmount (ví dụ: khi người dùng tự click nút quay về)
// 		// để ngăn không cho timeout/interval chạy ngầm.
// 		return () => {
// 			clearInterval(interval);
// 			clearTimeout(timeout);
// 		};
// 	}, [router]);

// 	return (
// 		<div
// 			className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-purple-800 via-indigo-700 to-pink-600 flex items-center justify-center text-white"
// 			onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
// 			{/* Dynamic background layers */}
// 			<div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-white/5 pointer-events-none animate-pulse-slow"></div>
// 			<div className="absolute inset-0 bg-gradient-conic from-pink-400 via-purple-600 to-indigo-500 opacity-20 pointer-events-none animate-spin-slower"></div>
// 			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>

// 			{/* Glow / neon blobs */}
// 			<div className="absolute -bottom-40 -right-40 w-[300px] h-[300px] bg-pink-500 rounded-full opacity-40 blur-3xl animate-pulse-slow"></div>
// 			<div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-purple-500 rounded-full opacity-40 blur-3xl animate-pulse-slow"></div>
// 			<div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent)]"></div>

// 			{/* Main content */}
// 			<div className="relative z-10 text-center flex flex-col items-center gap-2 px-4">
// 				{/* 404 chữ lớn VIP, dịu mắt */}
// 				<h1 className="relative text-[14rem] sm:text-[16rem] font-extrabold text-white drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] animate-bounce-slow">
// 					{/* Layer glitch dịu mắt */}
// 					{/* <span className="absolute text-pink-300 left-1 top-0 blur-sm animate-[glitch1_1s_infinite]">
// 						404
// 					</span> */}
// 					{/* <span className="absolute text-indigo-200 left-[-2px] top-1 blur-sm animate-[glitch2_1s_infinite]">
// 						404
// 					</span> */}
// 					404
// 				</h1>

// 				<p className="text-3xl sm:text-4xl font-semibold text-white/90 drop-shadow-md">
// 					Oops! Trang bạn tìm kiếm không tồn tại.
// 				</p>
// 				<p className="mt-4 text-lg text-white/70">
// 					Tự động quay về trang chủ sau{" "}
// 					<span className="font-bold text-white text-xl">{countdown}</span>{" "}
// 					giây...
// 				</p>
// 				{/* Interactive Button */}
// 				<button
// 					onClick={() => router.push("/")}
// 					className={clsx(
// 						"relative mt-6 px-10 py-3 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 text-white font-bold text-lg shadow-xl overflow-hidden",
// 						"transition-all duration-300 transform hover:scale-110 hover:shadow-[0_0_35px_rgba(255,255,255,0.7),0_0_60px_rgba(255,255,255,0.5)]"
// 					)}>
// 					<span
// 						className="absolute w-72 h-72 rounded-full bg-white opacity-20 pointer-events-none"
// 						style={{
// 							transform: `translate(${(mousePos.x - 500) / 10}px, ${
// 								(mousePos.x - 400) / 10
// 							}px)`,
// 						}}
// 					/>
// 					Quay về trang chủ
// 				</button>
// 			</div>

// 			<style jsx>{`
// 				// @keyframes glitch1 {
// 				//   0% { transform: translate(0, 0); opacity: 1; }
// 				//   20% { transform: translate(-4px, 2px); opacity: 0.85; }
// 				//   40% { transform: translate(3px, -2px); opacity: 0.9; }
// 				//   60% { transform: translate(-3px, 1px); opacity: 0.88; }
// 				//   80% { transform: translate(2px, -1px); opacity: 0.9; }
// 				//   100% { transform: translate(0, 0); opacity: 1; }
// 				// }
// 				// @keyframes glitch2 {
// 				//   0% { transform: translate(0, 0); opacity: 1; }
// 				//   20% { transform: translate(3px, -1px); opacity: 0.85; }
// 				//   40% { transform: translate(-3px, 2px); opacity: 0.9; }
// 				//   60% { transform: translate(2px, -1px); opacity: 0.9; }
// 				//   80% { transform: translate(-2px, 1px); opacity: 0.88; }
// 				//   100% { transform: translate(0, 0); opacity: 1; }
// 				// }

// 				/* Bounce chậm cho 404 */
// 				@keyframes bounce-slow {
// 					0%,
// 					100% {
// 						transform: translateY(0);
// 					}
// 					50% {
// 						transform: translateY(-25px);
// 					} /* Nảy mạnh hơn một chút */
// 				}
// 				.animate-bounce-slow {
// 					animation: bounce-slow 1.5s ease-in-out infinite;
// 				}
// 			`}</style>
// 		</div>
// 	);
// }

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
