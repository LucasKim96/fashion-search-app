/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx}", "../shared/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			keyframes: {
				spinSlow: {
					"0%": { transform: "rotate(0deg)" },
					"100%": { transform: "rotate(360deg)" },
				},
			},
			animation: {
				"spin-slow": "spinSlow 2s linear infinite",
			},
		},
	},
	plugins: [],
};
