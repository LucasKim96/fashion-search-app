/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx}", "../shared/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: "#1E40AF", // Xanh dương đậm, dùng cho button, icon chính
				"primary-light": "#3B82F6", // Xanh dương sáng, hover, highlight
				secondary: "#86EFAC", // Xanh lá nhạt, dùng accent, success
				"secondary-dark": "#22C55E", // Xanh lá đậm, hover
				bg: "#F9FAFB", // Nền chính
				"bg-alt": "#FFFFFF", // Nền card / section
				text: "#111827", // Text chính
				"text-muted": "#6B7280", // Text phụ / disabled
				border: "#E5E7EB", // Border chung
				error: "#EF4444", // Lỗi
				warning: "#F59E0B", // Cảnh báo
				info: "#3B82F6", // Thông tin / notice
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
