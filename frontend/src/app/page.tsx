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

    if (user.role === "Accountant") {
      router.replace("/accountant");
    } else if (user.role === "Parent") {
      router.replace("/parent");
    } else if (user.role === "Admin") {
      router.replace("/admin");
    } else if (user.role === "Teacher") {
      router.replace("/teacher");
    } else if (user.role === "Medical") {
      router.replace("/medical");
    }
  }, [user, token, isLoading, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-3 border-brand border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-muted">
          Đang điều hướng đến phân hệ tương ứng...
        </p>
      </div>
    </div>
  );
}
