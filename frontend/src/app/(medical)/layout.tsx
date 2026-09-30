"use client";

import { ReactNode, useState } from "react";
import RoleGuard from "@/components/layout/RoleGuard";
import AppNavbar from "@/components/layout/AppNavbar";
import AppSidebar, { NavItem } from "@/components/layout/AppSidebar";

const medicalNavItems: NavItem[] = [
  {
    label: "Theo dõi thể chất",
    href: "/medical/health",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Sổ lưu ý & Dị ứng",
    href: "/medical/health-notes",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Hồ sơ sức khỏe & Sự cố",
    href: "/medical/health-history",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Hộp thư thông báo sự cố",
    href: "/medical/notifications",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

export default function MedicalLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  return (
    <RoleGuard allowedRoles={["Medical"]}>
      <div
        className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans"
        style={{ ["--sidebar-w" as string]: isCollapsed ? "72px" : `${sidebarWidth}px` }}
      >
        <AppNavbar
          portalTitle="Cổng Y Tế"
          roleBadgeText="Cán bộ Y tế"
          homeHref="/medical/health"
          notificationsHref="/medical/notifications"
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        <div className="flex-1 flex pt-16">
          <AppSidebar
            portalName="Cổng Y Tế"
            navItems={medicalNavItems}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
            sidebarWidth={sidebarWidth}
            onWidthChange={setSidebarWidth}
          />

          <main className="flex-1 min-w-0 flex flex-col transition-[padding] duration-200 ease-in-out lg:pl-[var(--sidebar-w)] pb-24 sm:pb-32">
            <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
