"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { APP_NAME, type NavItem } from "@/config/navigation";
import { NavIcon } from "./NavIcon";

interface SidebarProps {
  items: NavItem[];
  roleLabel: string;
  onLogout: () => Promise<void>;
  onNavigate?: () => void;
  homeHref?: string;
}

export function Sidebar({ items, roleLabel, onLogout, onNavigate, homeHref }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await onLogout();
  }

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <aside className="w-[272px] min-w-[272px] h-screen sticky top-0 flex flex-col bg-card border-r border-border z-30 select-none">
      {/* Brand Header */}
      <Link
        href={homeHref || "/"}
        className="h-16 px-6 flex items-center gap-3 border-b border-border shrink-0 hover:opacity-90 transition-opacity"
      >
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-xs">
          <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-foreground tracking-tight truncate leading-tight">{APP_NAME}</span>
          <span className="text-[11px] font-medium text-muted leading-tight mt-0.5">Cổng thông tin quản lý</span>
        </div>
      </Link>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                active
                  ? "bg-brand text-white shadow-xs"
                  : "text-muted hover:bg-brand-subtle hover:text-brand-text"
              }`}
            >
              <NavIcon name={item.icon} className={`w-[18px] h-[18px] transition-colors ${active ? "text-white" : "text-muted"}`} />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile & session footer */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border">
          <div className="w-9 h-9 rounded-full bg-brand-subtle text-brand-text border border-brand-border text-xs font-bold flex items-center justify-center shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground truncate leading-snug">{user?.fullName || "Người dùng"}</p>
            <p className="text-[11px] font-medium text-muted truncate leading-tight">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Đăng xuất"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger-bg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loggingOut ? (
              <div className="w-3.5 h-3.5 border-2 border-muted border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}