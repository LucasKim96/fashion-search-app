"use client";

import ClientHeader from "@/components/layouts/ClientHeader";
import ClientFooter from "@/components/layouts/ClientFooter";

export default function HomePage() {
	return (
		<div className="min-h-screen flex flex-col bg-bg text-text">
			<ClientHeader />

			<main className="flex flex-1 w-full max-w-7xl mx-auto px-4 py-6">
				<section className="flex-1 bg-bg shadow-sm rounded-2xl p-6">
					<h1 className="text-3xl font-bold mb-4">Trang chủ FashionSearch</h1>
					<p>
						Chào mừng bạn đến với FashionSearch! Khám phá các sản phẩm thời
						trang mới nhất.
					</p>
					{/* Grid sản phẩm */}
					<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{[...Array(8)].map((_, i) => (
							<div
								key={i}
								className="bg-gray-100 rounded-xl p-4 flex flex-col items-center hover:shadow-lg transition">
								<div className="w-full h-40 bg-gray-300 rounded-md mb-2"></div>
								<h2 className="text-lg font-medium">Sản phẩm {i + 1}</h2>
								<p className="text-gray-600 mt-1">Giá: 100.000₫</p>
							</div>
						))}
					</div>
				</section>
			</main>

			<ClientFooter />
		</div>
	);
}
