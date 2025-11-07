/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url"; // 👈 Thêm import này
import { dirname } from "path"; // 👈 Thêm import này

// Thay thế __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename); // 👈 Khai báo lại __dirname

const IMAGE_DOMAIN = process.env.NEXT_PUBLIC_IMAGE_DOMAIN || "localhost";

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Alias nội bộ
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    // Alias dùng chung cho FE
    config.resolve.alias["@shared"] = path.resolve(__dirname, "../shared");
    return config;
  },
  experimental: {
    externalDir: true, // Cho phép import file CSS từ ngoài project (Monorepo)
  },
  images: {
    // ⚠️ Cảnh báo Next.js: `domains` bị lỗi thời, nhưng tôi sẽ giữ nó
    // cho đến khi bạn hoàn toàn chuyển sang remotePatterns
    domains: [IMAGE_DOMAIN],
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
};

export default nextConfig;
