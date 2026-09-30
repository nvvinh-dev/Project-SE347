"use client";

import { ReactNode, useState } from "react";
import RoleGuard from "@/components/layout/RoleGuard";
import AppNavbar from "@/components/layout/AppNavbar";
import AppSidebar, { NavItem } from "@/components/layout/AppSidebar";

const teacherNavItems: NavItem[] = [
  {
    label: "Điểm danh vào lớp",
    href: "/attendance",
    badge: "Hôm nay",
    badgeColorClass: "bg-status-success-soft text-status-success border-status-success/30",
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
    label: "Đón trẻ buổi chiều",
    href: "/pickup",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Lưu ý sức khỏe lớp",
    href: "/class-children",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Sức khỏe & Sự cố",
    href: "/incidents",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    label: "Ảnh hoạt động lớp",
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
  const [sidebarWidth, setSidebarWidth] = useState(256);

  return (
    <RoleGuard allowedRoles={["Teacher"]}>
      <div
        className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans"
        style={{ ["--sidebar-w" as string]: isCollapsed ? "72px" : `${sidebarWidth}px` }}
      >
        <AppNavbar
          portalTitle="Cổng Giáo Viên"
          roleBadgeText="Giáo viên"
          homeHref="/attendance"
          isSidebarCollapsed={isCollapsed}
          onToggleSidebarCollapse={() => setIsCollapsed((prev) => !prev)}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        <div className="flex-1 flex pt-16">
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

          <main className="flex-1 min-w-0 flex flex-col transition-[padding] duration-200 ease-in-out lg:pl-[var(--sidebar-w)]">
            <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
