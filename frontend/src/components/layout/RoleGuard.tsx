"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/auth";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
}

const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  Teacher: "Giáo viên",
  Medical: "Y tế",
  Accountant: "Kế toán / Văn phòng",
  Parent: "Phụ huynh",
  Admin: "Quản trị viên",
};

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // 1. Trạng thái đang tải phiên: Hiển thị Skeleton loading thanh thoát, chống giật màn hình (F5)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface p-6 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-4 animate-pulse">
          <div className="h-8 bg-surface-line rounded-md w-3/4 mx-auto" />
          <div className="h-4 bg-surface-line rounded w-1/2 mx-auto" />
          <div className="h-32 bg-surface-line rounded-lg mt-6" />
        </div>
      </div>
    );
  }

  // 2. Chưa đăng nhập: Render placeholder trong lúc useEffect chuyển hướng
  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <p className="text-ink-muted text-sm">Đang chuyển hướng đến trang đăng nhập...</p>
      </div>
    );
  }

  // 3. Sai vai trò: Hiển thị giao diện 403 thân thiện bằng tiếng Việt (không logout)
  if (!allowedRoles.includes(user.role)) {
    const requiredRoleNames = allowedRoles.map((r) => ROLE_DISPLAY_NAMES[r] ?? r).join(" hoặc ");
    const currentRoleName = ROLE_DISPLAY_NAMES[user.role] ?? user.role;

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-surface-line rounded-xl p-6 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-status-warning-soft text-status-warning flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-ink mb-2">Truy cập bị từ chối (403)</h2>
          <p className="text-sm text-ink-muted mb-4">
            Khu vực này chỉ dành cho vai trò <strong className="text-ink font-semibold">{requiredRoleNames}</strong>.
            Tài khoản hiện tại của bạn có vai trò là <strong className="text-ink font-semibold">{currentRoleName}</strong>.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-ink bg-surface hover:bg-surface-line rounded-lg transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Về trang đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Đúng vai trò: Render nội dung được bảo vệ
  return <>{children}</>;
}
