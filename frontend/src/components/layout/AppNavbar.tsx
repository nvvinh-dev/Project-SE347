"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";
import LogoutConfirmModal from "./LogoutConfirmModal";

interface AppNavbarProps {
  portalTitle: string;
  roleBadgeText: string;
  roleBadgeColorClass?: string;
  onToggleMobileMenu?: () => void;
}

export default function AppNavbar({
  portalTitle,
  roleBadgeText,
  roleBadgeColorClass = "bg-brand-soft text-brand border-brand/20",
  onToggleMobileMenu,
}: AppNavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Xử lý đăng xuất theo chuẩn D48:
  // Gọi POST /api/auth/logout trước để backend thu hồi token_version, sau đó mới xóa client state
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // Nếu backend chưa có hoặc lỗi mạng, vẫn tiếp tục dọn dẹp client
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      logout();
      router.replace("/login");
    }
  };

  // Xác định tên hiển thị (nếu chưa có fullName thì hiển thị roleBadgeText)
  const hasFullName = Boolean(user?.fullName && user.fullName.trim() !== "");
  const displayUserName = hasFullName ? user!.fullName : roleBadgeText;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-surface-line z-40 px-3 sm:px-6 flex items-center justify-between">
        {/* Nhóm bên trái: Nút Mobile + Logo + Tiêu đề Cổng & Thẻ vai trò */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Nút mở menu trên Mobile / Tablet (< 1024px) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Mở menu điều hướng"
            className="lg:hidden p-2 -ml-1 text-ink-muted hover:text-ink hover:bg-surface rounded-lg transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo ứng dụng - Màu thương hiệu Monty Brand #6D3BF5 */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 select-none">
            NT
          </div>

          {/* 1. GIAO DIỆN DI ĐỘNG (< 640px): Thẻ vai trò hiển thị BÊN DƯỚI chữ Cổng */}
          <div className="flex flex-col sm:hidden items-start leading-tight justify-center">
            <span className="font-bold text-ink text-xs tracking-tight">
              {portalTitle}
            </span>
            <span
              className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded-full border ${roleBadgeColorClass} mt-0.5 leading-none inline-block`}
            >
              {roleBadgeText}
            </span>
          </div>

          {/* 2. GIAO DIỆN MÁY TÍNH & TABLET (>= 640px): Chữ Cổng hiển thị BÊN DƯỚI chữ QUẢN LÝ NHÀ TRẺ */}
          <div className="hidden sm:flex flex-col items-start leading-tight justify-center">
            <span className="font-bold text-ink text-sm sm:text-base tracking-tight">
              QUẢN LÝ NHÀ TRẺ
            </span>
            <span className="text-[11px] sm:text-xs font-medium text-ink-muted mt-0.5">
              {portalTitle}
            </span>
          </div>
        </div>

        {/* Nhóm bên phải: Thông tin người dùng & Nút Đăng xuất */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-2 pl-1 sm:pl-2"
            title={`Tài khoản: ${displayUserName} • Vai trò: ${roleBadgeText}`}
          >
            <div className="w-8 h-8 rounded-full bg-surface border border-surface-line text-ink flex items-center justify-center font-semibold text-xs shrink-0 select-none">
              {displayUserName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-ink leading-tight truncate max-w-40">
                {displayUserName}
              </p>
              <p className="text-[10px] text-status-success font-medium leading-tight flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse shrink-0" />
                Đang hoạt động
              </p>
            </div>
          </div>

          <div className="h-4 w-px bg-surface-line mx-0.5 sm:mx-1" aria-hidden="true" />

          {/* Nút đăng xuất */}
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-status-danger hover:bg-status-danger-soft rounded-lg transition-colors cursor-pointer group"
            title="Đăng xuất khỏi hệ thống"
          >
            <svg
              className="w-4 h-4 text-ink-subtle group-hover:text-status-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Modal xác nhận đăng xuất */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
}
