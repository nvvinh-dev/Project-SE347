"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RootHomePage() {
  const { user, token, isLoading, logout } = useAuth();
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
    }
  }, [user, token, isLoading, router]);

  if (isLoading) {
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

  // Màn hình tạm cho Giáo viên / Y tế (khi chưa có route) có nút Đăng xuất để tránh kẹt vòng lặp
  if (user && (user.role === "Teacher" || user.role === "Medical")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-brand-subtle text-brand-text border border-brand-border flex items-center justify-center mx-auto mb-4 text-xl">
            ⏳
          </div>
          <h1 className="text-base font-bold text-foreground mb-2">Chưa có giao diện cho vai trò này</h1>
          <p className="text-xs text-muted mb-6">
            Giao diện cho vai trò <strong>{user.role === "Teacher" ? "Giáo viên" : "Nhân viên Y tế"}</strong> đang được phát triển. Vui lòng quay lại sau hoặc đăng xuất.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover active:bg-brand-active rounded-lg transition-colors cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

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
