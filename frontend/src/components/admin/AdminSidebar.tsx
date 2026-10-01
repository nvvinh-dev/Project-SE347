"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    name: "Tổng quan",
    href: "/admin/dashboard",
    badge: "Hôm nay",
    badgeType: "mint",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="7" height="9" x="3" y="3" rx="2" />
        <rect width="7" height="5" x="14" y="3" rx="2" />
        <rect width="7" height="9" x="14" y="12" rx="2" />
        <rect width="7" height="5" x="3" y="16" rx="2" />
      </svg>
    ),
  },
  {
    name: "Quản lý tài khoản",
    href: "/admin/users",
    badge: "5 Vai trò",
    badgeType: "neutral",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: "Xếp lớp & Phân công",
    href: "/admin/classes",
    badge: "3 Lớp",
    badgeType: "blue",
    icon: (
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 6 8-4 8 4" />
        <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" />
        <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
        <path d="M18 5v17" />
        <path d="M6 5v17" />
      </svg>
    ),
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#FEFEFE] border-r border-[#ECEDEC] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo & Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#ECEDEC]/80">
          <Link
            href="/admin/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            {/* Rounded Sprout Icon Container */}
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8F1] border border-[#A7E5D2]/60 flex items-center justify-center text-[#55B38F] shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 20h10" />
                <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4-.1 5.5.8z" />
                <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.4 1.7-4.6-2.7 0-4.2.8-4.9 2z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-[15px] tracking-tight text-[#121314] block leading-tight">
                Hệ thống Nhà trẻ
              </span>
              <span className="text-[11px] text-[#9FA2A1] font-medium leading-none block mt-1">
                Phân hệ Quản trị viên
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9FA2A1] hover:text-[#121314] hover:bg-[#F8F8F9] lg:hidden transition-colors"
            aria-label="Đóng thanh điều hướng"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#9FA2A1]">
              Phân hệ quản trị
            </p>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-4 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#55B38F] text-white shadow-[0_4px_14px_rgba(85,179,143,0.22)]"
                        : "text-[#606363] hover:bg-[#F8F8F9] hover:text-[#121314]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`transition-colors ${
                          isActive ? "text-white" : "text-[#9FA2A1]"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold transition-colors ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badgeType === "blue"
                            ? "bg-[#EAF7FC] text-[#17627D]"
                            : item.badgeType === "mint"
                            ? "bg-[#E8F8F1] text-[#1A624C]"
                            : "bg-[#F3F4F3] text-[#606363]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Support Card */}
        <div className="p-4 border-t border-[#ECEDEC]/80">
          <div className="px-4 py-3 rounded-2xl bg-[#F8F8F9] border border-[#ECEDEC] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#55B38F] animate-pulse" />
              <span className="font-semibold text-[#606363]">Trực tuyến</span>
            </div>
            <span className="text-[11px] text-[#9FA2A1]">Quản trị viên</span>
          </div>
        </div>
      </aside>
    </>
  );
}
