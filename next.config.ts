import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chặn Webpack xử lý chromadb
  experimental: {
    serverComponentsExternalPackages: ["chromadb"],
  },
  webpack: (config) => {
    // Ép các module gây lỗi thành rỗng (false)
    config.resolve.alias = {
      ...config.resolve.alias,
      "chromadb-default-embed": false, 
      "@xenova/transformers": false,
    };
    // Tắt cảnh báo rác
    config.ignoreWarnings = [{ module: /node_modules\/chromadb/ }];
    return config;
  },
};

export default nextConfig;