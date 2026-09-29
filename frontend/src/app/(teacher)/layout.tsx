"use client";

import { ReactNode, useState } from "react";
import RoleGuard from "@/components/layout/RoleGuard";
import AppNavbar from "@/components/layout/AppNavbar";
import AppSidebar, { NavItem } from "@/components/layout/AppSidebar";

// Bộ biểu tượng SVG tinh giản cho Giáo viên (chuẩn D35: không thêm package ngoài)
const teacherNavItems: NavItem[] = [
  {
    label: "Điểm danh vào lớp",
    href: "/attendance",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Lịch sử điểm danh",
    href: "/attendance-history",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Đón trả trẻ & Người đón",
    href: "/pickup",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Sức khỏe nhanh & Sự cố",
    href: "/incidents",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    label: "Danh sách lớp & Lưu ý",
    href: "/class-children",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: "Ảnh hoạt động",
    href: "/media",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(272);

  return (
    <RoleGuard allowedRoles={["Teacher"]}>
      <div
        className="min-h-screen bg-surface text-ink flex flex-col"
        style={{
          ["--sidebar-w" as string]: isCollapsed ? "72px" : `${sidebarWidth}px`,
        }}
      >
        {/* Navbar trên cùng */}
        <AppNavbar
          portalTitle="Cổng Giáo Viên"
          roleBadgeText="Giáo viên"
          roleBadgeColorClass="bg-brand-soft text-brand border-brand/20"
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Sidebar điều hướng */}
        <AppSidebar
          portalName="Cổng Giáo Viên"
          navItems={teacherNavItems}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          sidebarWidth={sidebarWidth}
          onWidthChange={setSidebarWidth}
        />

        {/* Khu vực nội dung chính: Căn chỉnh theo chuẩn Monty 1440px frame */}
        <main className="pt-16 flex-1 flex flex-col transition-[padding] duration-200 ease-in-out lg:pl-[var(--sidebar-w)]">
          <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
