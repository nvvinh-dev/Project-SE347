import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Ảnh QR VietQR do backend dựng URL (D21 mục 1); ngoại lệ duy nhất của D11, D17.
    remotePatterns: [{ protocol: "https", hostname: "img.vietqr.io", pathname: "/image/**" }],
  },
};

export default nextConfig;
