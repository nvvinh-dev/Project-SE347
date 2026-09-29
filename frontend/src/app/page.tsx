"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RootHomePage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    switch (user.role) {
      case "Accountant":
        router.replace("/accountant");
        break;
      case "Parent":
        router.replace("/parent");
        break;
      case "Admin":
        router.replace("/accountant");
        break;
      default:
        // Teacher/Medical or fallback
        router.replace("/login");
        break;
    }
  }, [user, token, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#F3F2F7] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-3 border-[#42B591] border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-[#6A677B]">
          Đang điều hướng đến phân hệ tương ứng...
        </p>
      </div>
    </div>
  );
}
