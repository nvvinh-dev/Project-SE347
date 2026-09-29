"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { NavItem } from "@/config/navigation";
import { NavIcon } from "./NavIcon";

interface SidebarProps {
  items: NavItem[];
  roleLabel: string;
  onLogout: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ items, roleLabel, onLogout, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await onLogout();
  }

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <aside className="w-[272px] min-w-[272px] h-screen sticky top-0 flex flex-col bg-white border-r border-[#E8E8EC] z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-[#E8E8EC] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#42B591] flex items-center justify-center shadow-xs">
          <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-[#16141F] tracking-tight truncate leading-tight">Mầm Non Sao Mai</span>
          <span className="text-[11px] font-medium text-[#6A677B] leading-tight mt-0.5">Cổng thông tin quản lý</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                active
                  ? "bg-[#42B591] text-white shadow-xs"
                  : "text-[#6A677B] hover:bg-[#F0FAF6] hover:text-[#247A60]"
              }`}
            >
              <NavIcon name={item.icon} className={`w-[18px] h-[18px] transition-colors ${active ? "text-white" : "text-[#6A677B]"}`} />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile & session footer */}
      <div className="p-4 border-t border-[#E8E8EC] bg-white shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-[#F9F9FB] border border-[#E8E8EC]">
          <div className="w-9 h-9 rounded-full bg-[#F0FAF6] text-[#247A60] border border-[#C4EDE0] text-xs font-bold flex items-center justify-center shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#16141F] truncate leading-snug">{user?.fullName || "Người dùng"}</p>
            <p className="text-[11px] font-medium text-[#6A677B] truncate leading-tight">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Đăng xuất"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6A677B] hover:text-[#E5484D] hover:bg-[#FEF2F2] transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}