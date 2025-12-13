"use client";

import React, { useEffect, useMemo, forwardRef } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	Cell,
} from "recharts";
import { Users, ShoppingBag, Store, UserCheck } from "lucide-react";

// Import hooks
import { useUser } from "@shared/features/user";
import { useProduct } from "@shared/features/product";
import { useAccount } from "@shared/features/account";

// =================================================================
// === UI COMPONENTS & HELPERS (Tích hợp sẵn)                   ===
// =================================================================
function cn(...inputs: (string | undefined | null | false)[]) {
	return inputs.filter(Boolean).join(" ");
}
const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("rounded-2xl bg-white p-6 shadow-lg", className)}
			{...props}
		/>
	)
);
Card.displayName = "Card";
const CardHeader = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5", className)}
		{...props}
	/>
));
CardHeader.displayName = "CardHeader";
const CardTitle = forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn("font-semibold tracking-tight text-slate-500", className)}
		{...props}
	/>
));
CardTitle.displayName = "CardTitle";
const CardContent = forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";
function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-slate-200", className)}
			{...props}
		/>
	);
}

// =================================================================
// === START: THAY THẾ HOÀN TOÀN StatCard BẰNG THIẾT KẾ MỚI      ===
// =================================================================
interface StatCardProps {
	title: string;
	value: number | string;
	icon: React.ElementType; // Thay đổi để nhận component icon, không phải instance
	loading: boolean;
	description?: string;
	color: "purple" | "blue" | "orange" | "green";
}
const StatCard: React.FC<StatCardProps> = ({
	title,
	value,
	icon: Icon, // Destructure và đổi tên để dùng như một component
	loading,
	description,
	color,
}) => {
	const colorClasses = {
		purple: {
			circle: "bg-purple-400",
			box: "from-purple-50 to-purple-100",
			text: "text-purple-600",
		},
		blue: {
			circle: "bg-blue-400",
			box: "from-blue-50 to-blue-100",
			text: "text-blue-600",
		},
		orange: {
			circle: "bg-orange-400",
			box: "from-orange-50 to-orange-100",
			text: "text-orange-600",
		},
		green: {
			circle: "bg-green-400",
			box: "from-green-50 to-green-100",
			text: "text-green-600",
		},
	};

	const selectedColor = colorClasses[color] || colorClasses.blue;

	return (
		<div className="group relative overflow-hidden p-4 bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1">
			<div
				className={cn(
					"absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 opacity-20 transition-transform duration-500 group-hover:scale-125",
					selectedColor.circle
				)}
			/>
			<div className="relative flex items-center gap-4">
				<div
					className={cn(
						"w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-inner",
						selectedColor.box,
						selectedColor.text
					)}>
					<Icon size={24} strokeWidth={2} className="drop-shadow-sm" />
				</div>
				<div className="flex flex-col">
					<span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
						{title}
					</span>
					{loading ? (
						<Skeleton className="h-6 w-16" />
					) : (
						<span className="text-xl font-black text-gray-800 tracking-tight">
							{value}
						</span>
					)}
				</div>
			</div>
			{description && (
				<p className="text-xs text-slate-500 mt-3 pl-1">{description}</p>
			)}
		</div>
	);
};
// ===============================================================
// === END: THAY THẾ HOÀN TOÀN StatCard                        ===
// ===============================================================

// ===============================================================
// === DASHBOARD PAGE COMPONENT                                ===
// ===============================================================
export default function DashboardPage() {
	// --- Logic Hooks and Data Fetching (Giữ nguyên) ---
	const { genderStatsState, ageStatsState, statsByGender, statsByAgeRange } =
		useUser();
	const { adminCountState, fetchAdminCount } = useProduct();
	const {
		statsByRoleState,
		countByRole,
		statsBannedState,
		countBannedAccountsStats,
	} = useAccount();

	useEffect(() => {
		statsByGender();
		statsByAgeRange();
		fetchAdminCount(true);
		countByRole();
		countBannedAccountsStats();
	}, []);

	const accountStats = useMemo(() => {
		const roles = statsByRoleState.data;
		const bannedStats = statsBannedState.data;
		const shopCount = roles?.find((r) => r.roleName === "Chủ shop")?.count ?? 0;
		const customerCount =
			roles?.find((r) => r.roleName === "Khách hàng")?.count ?? 0;
		const totalUserCount = bannedStats
			? bannedStats.banned + bannedStats.unbanned
			: 0;
		return {
			totalUsers: totalUserCount,
			totalShops: shopCount,
			totalCustomers: customerCount,
		};
	}, [statsByRoleState.data, statsBannedState.data]);

	const genderChartData = useMemo(() => {
		const data = genderStatsState.data;
		if (!data) return [];
		return data.map((item) => ({
			name: item._id === "male" ? "Nam" : item._id === "female" ? "Nữ" : "Khác",
			value: item.count,
		}));
	}, [genderStatsState.data]);

	const ageChartData = useMemo(() => {
		const data = ageStatsState.data;
		if (!data) return [];
		return Object.entries(data).map(([range, count]) => ({
			name: range,
			count,
		}));
	}, [ageStatsState.data]);

	const GENDER_COLORS = ["#3b82f6", "#f97316", "#10b981"];
	const AGE_BAR_COLOR = "#6366f1";

	return (
		<div className="min-h-screen w-full bg-slate-50 p-8">
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-3xl font-semibold text-gray-700 tracking-tight">
					BẢNG ĐIỀU KHIỂN
				</h2>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{/* === UPDATED: Truyền component icon, không phải instance === */}
				<StatCard
					title="Tổng Sản Phẩm"
					value={adminCountState.data}
					icon={ShoppingBag}
					loading={false}
					description="Tất cả sản phẩm"
					color="purple"
				/>
				<StatCard
					title="Tổng Người Dùng"
					value={accountStats.totalUsers}
					icon={Users}
					loading={statsBannedState.loading}
					description="Tất cả tài khoản"
					color="blue"
				/>
				<StatCard
					title="Tài Khoản Shop"
					value={accountStats.totalShops}
					icon={Store}
					loading={statsByRoleState.loading}
					description="Số lượng shop đã đăng ký"
					color="orange"
				/>
				<StatCard
					title="Tài Khoản Khách Hàng"
					value={accountStats.totalCustomers}
					icon={UserCheck}
					loading={statsByRoleState.loading}
					description="Số lượng khách hàng"
					color="green"
				/>
			</div>

			{/* Phần biểu đồ giữ nguyên không đổi */}
			<div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-12 lg:col-span-4">
					<CardHeader className="p-4 border-b border-slate-200">
						<CardTitle className="text-base text-slate-700">
							Thống Kê Người Dùng Theo Tuổi
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-6">
						{ageStatsState.loading ? (
							<Skeleton className="h-[350px] w-full" />
						) : (
							<ResponsiveContainer width="100%" height={350}>
								<BarChart
									data={ageChartData}
									margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
									<XAxis
										dataKey="name"
										stroke="#64748b"
										fontSize={12}
										tickLine={false}
										axisLine={false}
									/>
									<YAxis
										stroke="#64748b"
										fontSize={12}
										tickLine={false}
										axisLine={false}
									/>
									<Tooltip
										cursor={{ fill: "rgba(226, 232, 240, 0.7)" }}
										contentStyle={{
											backgroundColor: "#ffffff",
											borderColor: "#e2e8f0",
											boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
											borderRadius: "0.75rem",
										}}
									/>
									<Bar
										dataKey="count"
										fill={AGE_BAR_COLOR}
										radius={[4, 4, 0, 0]}
										barSize={30}
									/>
								</BarChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>
				<Card className="col-span-12 lg:col-span-3">
					<CardHeader className="p-4 border-b border-slate-200">
						<CardTitle className="text-base text-slate-700">
							Thống Kê Theo Giới Tính
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-6">
						{genderStatsState.loading ? (
							<Skeleton className="h-[350px] w-full" />
						) : (
							<ResponsiveContainer width="100%" height={350}>
								<PieChart>
									<Pie
										data={genderChartData}
										cx="50%"
										cy="50%"
										labelLine={false}
										label={({ name, percent }) =>
											`${name} ${(percent * 100).toFixed(0)}%`
										}
										outerRadius={100}
										innerRadius={60}
										paddingAngle={5}
										dataKey="value">
										{genderChartData.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={GENDER_COLORS[index % GENDER_COLORS.length]}
												strokeWidth={0}
											/>
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											backgroundColor: "#ffffff",
											borderColor: "#e2e8f0",
											boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
											borderRadius: "0.75rem",
										}}
									/>
									<Legend iconSize={10} />
								</PieChart>
							</ResponsiveContainer>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// "use client";

// import React, { useEffect, useMemo, forwardRef } from "react";
// import {
// 	Bar,
// 	BarChart,
// 	CartesianGrid,
// 	Legend,
// 	Pie,
// 	PieChart,
// 	ResponsiveContainer,
// 	Tooltip,
// 	XAxis,
// 	YAxis,
// 	Cell,
// } from "recharts";
// import { Users, ShoppingBag, Store, UserCheck } from "lucide-react";

// // Import hooks
// import { useUser } from "@shared/features/user";
// import { useProduct } from "@shared/features/product";
// import { useAccount } from "@shared/features/account";

// // =================================================================
// // === UI COMPONENTS & HELPERS (Tích hợp sẵn)                   ===
// // =================================================================
// function cn(...inputs: (string | undefined | null | false)[]) {
// 	return inputs.filter(Boolean).join(" ");
// }
// const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
// 	({ className, ...props }, ref) => (
// 		<div
// 			ref={ref}
// 			className={cn("rounded-2xl bg-white p-6 shadow-lg", className)}
// 			{...props}
// 		/>
// 	)
// );
// Card.displayName = "Card";
// const CardHeader = forwardRef<
// 	HTMLDivElement,
// 	React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
// 	<div
// 		ref={ref}
// 		className={cn("flex flex-col space-y-1.5", className)}
// 		{...props}
// 	/>
// ));
// CardHeader.displayName = "CardHeader";
// const CardTitle = forwardRef<
// 	HTMLParagraphElement,
// 	React.HTMLAttributes<HTMLHeadingElement>
// >(({ className, ...props }, ref) => (
// 	<h3
// 		ref={ref}
// 		className={cn("font-semibold tracking-tight text-slate-500", className)}
// 		{...props}
// 	/>
// ));
// CardTitle.displayName = "CardTitle";
// const CardContent = forwardRef<
// 	HTMLDivElement,
// 	React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
// 	<div ref={ref} className={cn("", className)} {...props} />
// ));
// CardContent.displayName = "CardContent";
// function Skeleton({
// 	className,
// 	...props
// }: React.HTMLAttributes<HTMLDivElement>) {
// 	return (
// 		<div
// 			className={cn("animate-pulse rounded-md bg-slate-200", className)}
// 			{...props}
// 		/>
// 	);
// }

// // === UPDATED HELPER: StatCard với thiết kế màu sắc hài hòa ===
// interface StatCardProps {
// 	title: string;
// 	value: number | string;
// 	icon: React.ReactNode;
// 	loading: boolean;
// 	description?: string;
// 	color: string; // e.g., 'blue', 'green', 'orange', 'purple'
// }
// const StatCard: React.FC<StatCardProps> = ({
// 	title,
// 	value,
// 	icon,
// 	loading,
// 	description,
// 	color,
// }) => {
// 	const colorClasses = {
// 		blue: { bg: "bg-blue-100", text: "text-blue-600" },
// 		green: { bg: "bg-green-100", text: "text-green-600" },
// 		orange: { bg: "bg-orange-100", text: "text-orange-600" },
// 		purple: { bg: "bg-indigo-100", text: "text-indigo-600" },
// 	};
// 	const selectedColor =
// 		colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

// 	return (
// 		<Card className="p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
// 			<div className="flex items-center gap-4">
// 				<div
// 					className={cn(
// 						"flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
// 						selectedColor.bg
// 					)}>
// 					<div className={cn("h-6 w-6", selectedColor.text)}>{icon}</div>
// 				</div>
// 				<div className="flex-1">
// 					<p className="text-sm font-medium text-slate-500 truncate">{title}</p>
// 					{loading ? (
// 						<Skeleton className="h-8 w-16 mt-1" />
// 					) : (
// 						<p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
// 					)}
// 				</div>
// 			</div>
// 			{description && (
// 				<p className="text-xs text-slate-400 mt-3">{description}</p>
// 			)}
// 		</Card>
// 	);
// };

// // ===============================================================
// // === DASHBOARD PAGE COMPONENT                                ===
// // ===============================================================
// export default function DashboardPage() {
// 	// --- Logic Hooks and Data Fetching (Giữ nguyên) ---
// 	const { genderStatsState, ageStatsState, statsByGender, statsByAgeRange } =
// 		useUser();
// 	const { adminCountState, fetchAdminCount } = useProduct();
// 	const {
// 		statsByRoleState,
// 		countByRole,
// 		statsBannedState,
// 		countBannedAccountsStats,
// 	} = useAccount();

// 	useEffect(() => {
// 		statsByGender();
// 		statsByAgeRange();
// 		fetchAdminCount(true);
// 		countByRole();
// 		countBannedAccountsStats();
// 	}, []);

// 	const accountStats = useMemo(() => {
// 		const roles = statsByRoleState.data;
// 		const bannedStats = statsBannedState.data;
// 		const shopCount = roles?.find((r) => r.roleName === "Chủ shop")?.count ?? 0;
// 		const customerCount =
// 			roles?.find((r) => r.roleName === "Khách hàng")?.count ?? 0;
// 		const totalUserCount = bannedStats
// 			? bannedStats.banned + bannedStats.unbanned
// 			: 0;
// 		return {
// 			totalUsers: totalUserCount,
// 			totalShops: shopCount,
// 			totalCustomers: customerCount,
// 		};
// 	}, [statsByRoleState.data, statsBannedState.data]);

// 	const genderChartData = useMemo(() => {
// 		const data = genderStatsState.data;
// 		if (!data) return [];
// 		return data.map((item) => ({
// 			name: item._id === "male" ? "Nam" : item._id === "female" ? "Nữ" : "Khác",
// 			value: item.count,
// 		}));
// 	}, [genderStatsState.data]);

// 	const ageChartData = useMemo(() => {
// 		const data = ageStatsState.data;
// 		if (!data) return [];
// 		return Object.entries(data).map(([range, count]) => ({
// 			name: range,
// 			count,
// 		}));
// 	}, [ageStatsState.data]);

// 	// === UPDATED COLORS: Bảng màu mới hài hòa hơn ===
// 	const GENDER_COLORS = ["#3b82f6", "#f97316", "#10b981"]; // Blue, Orange, Green
// 	const AGE_BAR_COLOR = "#6366f1"; // Indigo

// 	return (
// 		<div className="min-h-screen w-full bg-slate-50 p-8">
// 			<div className="flex items-center justify-between mb-8">
// 				<h1 className="text-3xl font-bold tracking-tight text-slate-800">
// 					Bảng Điều Khiển
// 				</h1>
// 			</div>

// 			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
// 				<StatCard
// 					title="Tổng Sản Phẩm"
// 					value={adminCountState.data}
// 					icon={<ShoppingBag />}
// 					loading={false}
// 					description="Tất cả sản phẩm"
// 					color="purple"
// 				/>
// 				<StatCard
// 					title="Tổng Người Dùng"
// 					value={accountStats.totalUsers}
// 					icon={<Users />}
// 					loading={statsBannedState.loading}
// 					description="Tất cả tài khoản"
// 					color="blue"
// 				/>
// 				<StatCard
// 					title="Tài Khoản Shop"
// 					value={accountStats.totalShops}
// 					icon={<Store />}
// 					loading={statsByRoleState.loading}
// 					description="Số lượng shop đã đăng ký"
// 					color="orange"
// 				/>
// 				<StatCard
// 					title="Tài Khoản Khách Hàng"
// 					value={accountStats.totalCustomers}
// 					icon={<UserCheck />}
// 					loading={statsByRoleState.loading}
// 					description="Số lượng khách hàng"
// 					color="green"
// 				/>
// 			</div>

// 			<div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-7">
// 				<Card className="col-span-12 lg:col-span-4">
// 					<CardHeader className="p-4 border-b border-slate-200">
// 						<CardTitle className="text-base text-slate-700">
// 							Thống Kê Người Dùng Theo Tuổi
// 						</CardTitle>
// 					</CardHeader>
// 					<CardContent className="pt-6">
// 						{ageStatsState.loading ? (
// 							<Skeleton className="h-[350px] w-full" />
// 						) : (
// 							<ResponsiveContainer width="100%" height={350}>
// 								<BarChart
// 									data={ageChartData}
// 									margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
// 									<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
// 									<XAxis
// 										dataKey="name"
// 										stroke="#64748b"
// 										fontSize={12}
// 										tickLine={false}
// 										axisLine={false}
// 									/>
// 									<YAxis
// 										stroke="#64748b"
// 										fontSize={12}
// 										tickLine={false}
// 										axisLine={false}
// 									/>
// 									<Tooltip
// 										cursor={{ fill: "rgba(226, 232, 240, 0.7)" }}
// 										contentStyle={{
// 											backgroundColor: "#ffffff",
// 											borderColor: "#e2e8f0",
// 											boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
// 											borderRadius: "0.75rem",
// 										}}
// 									/>
// 									<Bar
// 										dataKey="count"
// 										fill={AGE_BAR_COLOR}
// 										radius={[4, 4, 0, 0]}
// 										barSize={30}
// 									/>
// 								</BarChart>
// 							</ResponsiveContainer>
// 						)}
// 					</CardContent>
// 				</Card>

// 				<Card className="col-span-12 lg:col-span-3">
// 					<CardHeader className="p-4 border-b border-slate-200">
// 						<CardTitle className="text-base text-slate-700">
// 							Thống Kê Theo Giới Tính
// 						</CardTitle>
// 					</CardHeader>
// 					<CardContent className="pt-6">
// 						{genderStatsState.loading ? (
// 							<Skeleton className="h-[350px] w-full" />
// 						) : (
// 							<ResponsiveContainer width="100%" height={350}>
// 								<PieChart>
// 									<Pie
// 										data={genderChartData}
// 										cx="50%"
// 										cy="50%"
// 										labelLine={false}
// 										label={({ name, percent }) =>
// 											`${name} ${(percent * 100).toFixed(0)}%`
// 										}
// 										outerRadius={100}
// 										innerRadius={60}
// 										paddingAngle={5}
// 										dataKey="value">
// 										{genderChartData.map((entry, index) => (
// 											<Cell
// 												key={`cell-${index}`}
// 												fill={GENDER_COLORS[index % GENDER_COLORS.length]}
// 												strokeWidth={0}
// 											/>
// 										))}
// 									</Pie>
// 									<Tooltip
// 										contentStyle={{
// 											backgroundColor: "#ffffff",
// 											borderColor: "#e2e8f0",
// 											boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
// 											borderRadius: "0.75rem",
// 										}}
// 									/>
// 									<Legend iconSize={10} />
// 								</PieChart>
// 							</ResponsiveContainer>
// 						)}
// 					</CardContent>
// 				</Card>
// 			</div>
// 		</div>
// 	);
// }
