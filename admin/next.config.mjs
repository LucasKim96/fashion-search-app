// admin/next.config.mjs
import path from "path";

const IMAGE_DOMAIN = process.env.NEXT_PUBLIC_IMAGE_DOMAIN || "localhost";

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(".", "src");
    config.resolve.alias["@shared"] = path.resolve(".", "../shared");
    return config;
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
};

export default nextConfig;
