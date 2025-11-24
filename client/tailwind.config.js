/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx}", "../shared/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				// --- CHỦ ĐẠO: VÀNG (Dùng cho Button chính, Icon nổi bật) ---
				primary: "#EAB308", // Vàng Gold đậm (Yellow-500) - Dễ nhìn trên nền trắng/đen
				"primary-light": "#FACC15", // Vàng sáng hơn (Yellow-400) - Dùng khi hover
				"primary-dark": "#B45309", // Vàng đậm hơn (Yellow-600) - Dùng khi active hoặc focus

				// --- CHI TIẾT: ĐỎ ĐẬM (Accent, Sale, Notification) ---
				secondary: "#B91C1C", // Đỏ đô (Red-700) - Sang trọng
				"secondary-dark": "#7F1D1D", // Đỏ thẫm (Red-900) - Dùng khi hover

				// --- NỀN: TRẮNG ---
				bg: "#FFFFFF", // Trắng tinh - Làm nền chủ đạo
				"bg-alt": "#F9FAFB", // Xám cực nhạt - Dùng phân cách các section hoặc card

				// --- CHỮ: ĐEN ---
				text: "#000000", // Đen tuyền - Tạo độ tương phản cao
				"text-muted": "#4B5563", // Xám ghi - Dùng cho text phụ, mô tả

				// --- CÁC MÀU HỆ THỐNG KHÁC (Giữ nguyên hoặc chỉnh nhẹ) ---
				border: "#E5E7EB", // Viền xám nhạt
				error: "#DC2626", // Đỏ tươi báo lỗi
				warning: "#F59E0B", // Cam cảnh báo
				info: "#2563EB", // Xanh thông tin
			},
			borderRadius: {
				xl: "1rem",
				"2xl": "1.5rem",
			},
			boxShadow: {
				sm: "0 1px 2px rgba(0,0,0,0.05)",
				DEFAULT: "0 1px 3px rgba(0,0,0,0.1)",
				md: "0 4px 6px rgba(0,0,0,0.1)",
			},
		},
	},
	plugins: [],
};
