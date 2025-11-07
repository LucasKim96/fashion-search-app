// admin/next.config.mjs
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGE_DOMAIN = process.env.NEXT_PUBLIC_IMAGE_DOMAIN || "localhost";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Không dùng LightningCSS (vì gây lỗi .node)
  compiler: {
    lightningcss: false,
  },

  experimental: {
    externalDir: true, // Cho phép import từ ../shared
  },

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

  // ⚡ Bắt buộc để Turbopack hiểu có cấu hình hợp lệ
  turbopack: {},
};

export default nextConfig;
