"use client";

import { ReactNode, useEffect, useState } from "react";
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

  // [Dev Mode] Hỗ trợ xem trước UI khi backend chưa seed tài khoản Giáo viên/Y tế
  const [isDevPreview, setIsDevPreview] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Chỉ tự động redirect về /login trong production nếu chưa đăng nhập
    if (!isLoading && !user && !isDevPreview && !isDev) {
      router.replace("/login");
    }
  }, [isLoading, user, isDevPreview, isDev, router]);

  // [Dev Mode] Render UI xem trước
  if (isDev && isDevPreview) {
    return (
      <>
        {children}
        {/* Huy hiệu xem trước */}
        <div className="fixed bottom-3 right-3 z-50 bg-ink/90 text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 backdrop-blur-xs select-none">
          <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse" />
          <span>Dev Preview: {allowedRoles.map((r) => ROLE_DISPLAY_NAMES[r] ?? r).join(" / ")}</span>
          <button
            type="button"
            onClick={() => setIsDevPreview(false)}
            className="ml-1 text-ink-subtle hover:text-white underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </>
    );
  }

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

  // 2. Chưa đăng nhập:
  if (!user) {
    // [Dev Mode] Xem trước khi chưa đăng nhập
    if (isDev) {
      const targetRoleNames = allowedRoles.map((r) => ROLE_DISPLAY_NAMES[r] ?? r).join(" hoặc ");
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-2xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Kiểm tra giao diện Cổng {targetRoleNames}
            </h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Bạn đang ở môi trường phát triển cục bộ và chưa đăng nhập phiên backend.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setIsDevPreview(true)}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                Xem giao diện (Dev Mode) →
              </button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                Đến trang Đăng nhập hệ thống
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-400 text-sm">Đang chuyển hướng đến trang đăng nhập...</p>
      </div>
    );
  }

  // 3. Sai vai trò:
  if (!allowedRoles.includes(user.role)) {
    const requiredRoleNames = allowedRoles.map((r) => ROLE_DISPLAY_NAMES[r] ?? r).join(" hoặc ");
    const currentRoleName = ROLE_DISPLAY_NAMES[user.role] ?? user.role;

    // [Dev Mode] Giao diện đồng nhất 100% với màn hình kiểm tra chưa đăng nhập
    if (isDev) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-2xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Kiểm tra giao diện Cổng {requiredRoleNames}
            </h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Khu vực này dành cho vai trò <strong className="text-slate-800 font-semibold">{requiredRoleNames}</strong> (tài khoản hiện tại của bạn là <strong className="text-slate-800 font-semibold">{currentRoleName}</strong>).
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setIsDevPreview(true)}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                Xem giao diện (Dev Mode) →
              </button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                Đến trang Đăng nhập hệ thống
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mt-0.5"
              >
                ← Quay lại trang trước
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Môi trường Production: Thông báo 403 chuẩn
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mx-auto mb-4 font-bold text-xl shadow-2xs">
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
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Truy cập bị từ chối (403)</h2>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Khu vực này chỉ dành cho vai trò <strong className="text-slate-800 font-semibold">{requiredRoleNames}</strong>.
            Tài khoản hiện tại của bạn có vai trò là <strong className="text-slate-800 font-semibold">{currentRoleName}</strong>.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            >
              Về trang đăng nhập
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              Quay lại trang trước
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Đúng vai trò: Render nội dung được bảo vệ
  return <>{children}</>;
}
