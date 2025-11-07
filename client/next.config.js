/** @type {import('next').NextConfig} */
const path = require("path");

const IMAGE_DOMAIN = process.env.NEXT_PUBLIC_IMAGE_DOMAIN || "localhost";

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    // Alias nội bộ
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    // Alias dùng chung cho FE
    config.resolve.alias["@shared"] = path.resolve(__dirname, "../shared");
    return config;
  },
  images: {
    // Cho phép ảnh từ BE (uploads/assets)
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

module.exports = nextConfig;
