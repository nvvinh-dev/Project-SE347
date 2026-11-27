import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Ảnh QR VietQR do backend dựng URL (D21 mục 1); ngoại lệ duy nhất của D11, D17.
    remotePatterns: [{ protocol: "https", hostname: "img.vietqr.io", pathname: "/image/**" }],
  },
  // D57: tắt cờ thì màn hình Ngân hàng giả lập trả HTTP 404 thật (không chỉ giao diện 404).
  async rewrites() {
    return {
      beforeFiles: process.env.NEXT_PUBLIC_MOCK_BANK_ENABLED === "true"
        ? []
        : [{ source: "/parent/mock-bank", destination: "/khong-ton-tai" }],
    };
  },
};

export default nextConfig;
