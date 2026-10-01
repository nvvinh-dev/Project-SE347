"use client";

import React from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { Sidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { accountantNav } from "@/config/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AccountantLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <RoleGuard allowed={["Accountant"]}>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block shrink-0">
          <Sidebar items={accountantNav} roleLabel="Kế toán trường" onLogout={logout} />
        </div>
        <MobileNav items={accountantNav} roleLabel="Kế toán trường" userName={user?.fullName || "Kế toán viên"} onLogout={logout} />
        <main className="flex-1 min-w-0 lg:pt-0 pt-16">
          <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}