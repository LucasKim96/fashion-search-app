// "use client";

// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
//   LineChart,
//   Line,
// } from "recharts";
// import { TrendingUp, ShoppingCart, DollarSign, Package } from "lucide-react";

// export default function SellerStatisticsPage() {
//   const revenueData = [
//     { month: "Th1", revenue: 3200000 },
//     { month: "Th2", revenue: 4200000 },
//     { month: "Th3", revenue: 6800000 },
//     { month: "Th4", revenue: 5200000 },
//     { month: "Th5", revenue: 8000000 },
//     { month: "Th6", revenue: 9400000 },
//   ];

//   const topProducts = [
//     { name: "Áo thun nam", sales: 145 },
//     { name: "Hoodie basic", sales: 120 },
//     { name: "Quần jeans", sales: 87 },
//     { name: "Áo sơ mi trắng", sales: 64 },
//   ];

//   const stats = [
//     {
//       icon: DollarSign,
//       label: "Tổng doanh thu",
//       value: "9.400.000₫",
//       color: "text-green-500",
//     },
//     {
//       icon: ShoppingCart,
//       label: "Đơn hàng tháng",
//       value: "124",
//       color: "text-blue-500",
//     },
//     {
//       icon: Package,
//       label: "Sản phẩm bán ra",
//       value: "312",
//       color: "text-emerald-500",
//     },
//     {
//       icon: TrendingUp,
//       label: "Tăng trưởng",
//       value: "+18%",
//       color: "text-indigo-500",
//     },
//   ];

//   return (
//     <div className="flex flex-col gap-8">
//       <h1 className="text-2xl font-bold text-primary">Thống kê doanh thu</h1>

//       {/* Tổng quan nhanh */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {stats.map(({ icon: Icon, label, value, color }) => (
//           <div
//             key={label}
//             className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 hover:shadow-md transition"
//           >
//             <Icon size={26} className={color} />
//             <p className="text-sm text-text/70">{label}</p>
//             <p className="text-xl font-semibold text-text">{value}</p>
//           </div>
//         ))}
//       </div>

//       {/* Biểu đồ doanh thu */}
//       <div className="bg-white rounded-xl shadow p-6">
//         <h2 className="font-semibold text-text mb-4">Doanh thu theo tháng</h2>
//         <div className="w-full h-64">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={revenueData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis tickFormatter={(v) => `${v / 1000000}M`} />
//               <Tooltip formatter={(v) => `${v.toLocaleString()}₫`} />
//               <Line
//                 type="monotone"
//                 dataKey="revenue"
//                 stroke="#3b82f6"
//                 strokeWidth={2}
//                 dot={{ r: 4 }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Top sản phẩm */}
//       <div className="bg-white rounded-xl shadow p-6">
//         <h2 className="font-semibold text-text mb-4">Top sản phẩm bán chạy</h2>
//         <div className="w-full h-64">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={topProducts}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="sales" fill="#22c55e" radius={[8, 8, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// }
"use client";

import { useState } from "react";
import { ProductDetailLayout } from "@shared/features/product";

export default function ProductPage() {
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<div>
			<button onClick={() => setIsModalOpen(true)}>Xem nhanh sản phẩm</button>

			<ProductDetailLayout
				isModal={true} // Bật chế độ Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				// DIV 1: Ảnh
				imageWidth="w-full md:w-[250px]"
				imageContent={
					<div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
						<img
							src="/test-product.jpg"
							className="w-[70] h-full object-cover"
						/>
					</div>
				}
				// DIV 2: Header
				headerContent={
					<div className="space-y-3">
						<h1 className="text-2xl font-bold">Áo Thun Form Rộng</h1>
						<p className="text-xl text-emerald-600 font-bold">150.000 ₫</p>
						<div className="flex gap-2">
							<span className="px-3 py-1 bg-gray-100 rounded">Size M</span>
							<span className="px-3 py-1 bg-gray-100 rounded">Size L</span>
						</div>
					</div>
				}
				// DIV 3: Detail
				detailContent={
					<div className="text-gray-600 text-sm leading-relaxed">
						<p>Chất liệu cotton 100% thoáng mát.</p>
						<p>Thích hợp mặc đi chơi, dạo phố.</p>
					</div>
				}
				// DIV 4: Footer (Option - Có HR ngăn cách)
				footerContent={
					<div className="flex justify-end gap-3">
						<button className="px-4 py-2 border rounded">Hủy</button>
						<button className="px-4 py-2 bg-blue-600 text-white rounded">
							Thêm vào giỏ
						</button>
					</div>
				}
			/>
		</div>
	);
}
