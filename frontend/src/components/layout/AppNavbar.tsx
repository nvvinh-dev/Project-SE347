"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import LogoutConfirmModal from "./LogoutConfirmModal";

interface AppNavbarProps {
  portalTitle: string;
  roleBadgeText: string;
  notificationsHref?: string;
  onToggleMobileMenu?: () => void;
  homeHref?: string;
}

export default function AppNavbar({
  portalTitle,
  roleBadgeText,
  notificationsHref,
  onToggleMobileMenu,
  homeHref = "/",
}: AppNavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Xử lý đăng xuất theo chuẩn D48:
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const displayUserName = user?.fullName || "Người dùng";

  // Ngày hôm nay theo định dạng tiếng Việt chuẩn
  const todayFormatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-surface-line z-40 px-3 sm:px-6 flex items-center justify-between shadow-2xs">
        {/* Nhóm bên trái: Nút Mobile + Logo + Nút thu gọn menu + Ngày tháng tiếng Việt */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Nút mở menu trên Mobile / Tablet (< 1024px) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Mở menu điều hướng"
            className="lg:hidden p-2 -ml-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo Trường Mầm Non Sao Mai (theo ảnh mẫu 1) */}
          <Link href={homeHref} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/90 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-emerald-700 transition-colors">
                Mầm Non Sao Mai
              </span>
              <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                {portalTitle}
              </span>
            </div>
          </Link>

          {/* Dải phân cách */}
          <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1" aria-hidden="true" />

          {/* Thời gian hiển thị ở bên trái */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs font-medium text-slate-600">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="capitalize">{todayFormatted}</span>
          </div>
        </div>

        {/* Nhóm bên phải: Chuông thông báo + Người dùng + Đăng xuất */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Chuông thông báo (chỉ hiển thị khi có notificationsHref, không có chấm đỏ theo D25) */}
          {notificationsHref && (
            <Link
              href={notificationsHref}
              className="relative w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Thông báo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>
          )}

          {/* Thông tin người dùng dạng viên nang (như ảnh mẫu) */}
          <div
            className="flex items-center gap-2 p-1 pr-3 rounded-xl bg-slate-50 border border-slate-200"
            title={`${displayUserName} — ${roleBadgeText}`}
          >
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
              {displayUserName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <p className="text-xs font-bold text-slate-900 truncate max-w-36">
                {displayUserName}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {roleBadgeText}
              </p>
            </div>
          </div>

          {/* Nút đăng xuất dạng soft pill đỏ nhạt (như ảnh mẫu) */}
          <button
            type="button"
            id="navbar-logout-btn"
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all cursor-pointer shrink-0"
            title="Đăng xuất khỏi hệ thống"
          >
            <svg
              className="w-3.5 h-3.5"
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

      {/* Modal xác nhận đăng xuất chuẩn D48 */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
}
