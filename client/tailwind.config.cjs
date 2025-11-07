/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts,jsx,tsx}", // dùng chung
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          500: "#7c3aed",
          700: "#5b21b6",
        },
      },
    },
  },
  plugins: [],
};
