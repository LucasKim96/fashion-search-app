// admin/next.config.mjs
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGE_DOMAIN = process.env.NEXT_PUBLIC_IMAGE_DOMAIN || "localhost";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⚙️ LightningCSS không còn config thủ công, bỏ luôn hoặc thay bằng optimizeCss
  experimental: {
    externalDir: true, // Cho phép import từ ../shared
    optimizeCss: false, // tắt LightningCSS nếu cần
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: IMAGE_DOMAIN,
        port: process.env.NODE_ENV === "development" ? "5000" : "",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: IMAGE_DOMAIN,
        port: process.env.NODE_ENV === "development" ? "5000" : "",
        pathname: "/assets/**",
      },
    ],
  },

  // Bắt buộc để Turbopack hiểu có cấu hình hợp lệ
  // ⚡ Turbopack config (nếu sếp dùng dev server mới)
  turbopack: {},
};

export default nextConfig;
