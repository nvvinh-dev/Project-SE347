"use client";

import React from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { Sidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { medicalNav } from "@/config/navigation";
import { useAuth } from "@/context/AuthContext";

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <RoleGuard allowed={["Medical"]}>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block shrink-0">
          <Sidebar
            items={medicalNav}
            roleLabel="Nhân viên Y tế"
            onLogout={logout}
            notificationsHref="/medical/notifications"
          />
        </div>
        <MobileNav
          items={medicalNav}
          roleLabel="Nhân viên Y tế"
          userName={user?.fullName || "Nhân viên Y tế"}
          onLogout={logout}
          notificationsHref="/medical/notifications"
        />
        <main className="flex-1 min-w-0 lg:pt-0 pt-16">
          <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
