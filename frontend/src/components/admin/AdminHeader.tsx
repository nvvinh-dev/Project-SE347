"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AdminHeaderProps {
  onOpenSidebar: () => void;
  onOpenLogout: () => void;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Bảng điều hành tổng quan",
    subtitle: "Chỉ số hoạt động, điểm danh và học phí",
  },
  "/users": {
    title: "Quản lý tài khoản & Phân quyền",
    subtitle: "Danh sách người dùng và phân quyền 5 vai trò hệ thống",
  },
  "/classes": {
    title: "Xếp lớp học & Phân công",
    subtitle: "Quản lý 3 khối lớp và giáo viên chủ nhiệm",
  },
};

export function AdminHeader({ onOpenSidebar, onOpenLogout }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const currentMeta = pageTitles[pathname] || {
    title: "Khu vực Quản trị",
    subtitle: "Hệ thống quản lý mầm non",
  };

  const displayName = user?.fullName?.trim() ? user.fullName : "Nguyễn Văn Vinh";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-20 bg-[#FEFEFE]/90 backdrop-blur-md border-b border-[#ECEDEC] px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left: Mobile Toggle & Page Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2.5 rounded-2xl text-[#606363] hover:bg-[#F8F8F9] hover:text-[#121314] lg:hidden border border-[#ECEDEC] transition-colors"
          aria-label="Mở menu điều hướng"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-[#121314] tracking-tight">
              {currentMeta.title}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/50">
              Quản trị viên
            </span>
          </div>
          <p className="hidden md:block text-xs text-[#9FA2A1]">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Tools, Notifications, User Profile & Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Notification Bell with Badge */}
        <button
          type="button"
          title="Thông báo hệ thống (2 việc cần xử lý)"
          className="relative p-2.5 rounded-full border border-[#ECEDEC] bg-[#FEFEFE] text-[#606363] hover:bg-[#F8F8F9] hover:text-[#121314] transition-colors"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E8916E] ring-2 ring-white" />
        </button>

        {/* User Card with Baby Blue / Pastel Avatar */}
        <div className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-[#F8F8F9] border border-[#ECEDEC]">
          <div className="w-8 h-8 rounded-full bg-[#D5E3F2] text-[#17627D] font-bold text-xs flex items-center justify-center shadow-2xs">
            {userInitial}
          </div>
          <div className="hidden sm:block text-left pr-1">
            <p className="text-xs font-bold text-[#121314] leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-[#9FA2A1] font-medium leading-none">
              Ban Giám Hiệu
            </p>
          </div>
        </div>

        {/* Logout Button (§18, D48) */}
        <button
          onClick={onOpenLogout}
          title="Đăng xuất khỏi hệ thống"
          className="flex items-center gap-1.5 py-2 px-3.5 sm:px-4 rounded-full text-xs font-semibold border border-[#FAC4CD] bg-[#FFF0F2] text-[#E8916E] hover:bg-[#FFE3EC] hover:text-[#D96B43] transition-all"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
