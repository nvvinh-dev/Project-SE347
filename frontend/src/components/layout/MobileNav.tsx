"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, type NavItem } from "@/config/navigation";
import { NavIcon } from "./NavIcon";

interface MobileNavProps {
  items: NavItem[];
  roleLabel: string;
  userName: string;
  onLogout: () => Promise<void>;
}

export function MobileNav({ items, roleLabel, userName, onLogout }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

  async function handleLogout() {
    setLoggingOut(true);
    await onLogout();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-xs">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
          </div>
          <span className="text-sm font-bold text-foreground">{APP_NAME}</span>
          <span className="text-[10px] font-semibold bg-brand-subtle text-brand-text px-2 py-0.5 rounded-full border border-brand-border">{roleLabel}</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background text-foreground transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Overlay drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-card shadow-2xl flex flex-col duration-200">
            {/* Header */}
            <div className="h-16 px-6 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-xs">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground">{APP_NAME}</span>
                <span className="text-[11px] font-semibold text-brand-text">{roleLabel}</span>
              </div>
            </div>

            {/* Nav list */}
            <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
              {items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                      active ? "bg-brand text-white shadow-xs" : "text-muted hover:bg-brand-subtle hover:text-brand-text"
                    }`}
                  >
                    <NavIcon name={item.icon} className={`w-[18px] h-[18px] ${active ? "text-white" : "text-muted"}`} />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border">
                <div className="w-8 h-8 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
                  {userName.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground truncate">{userName}</p>
                  <p className="text-[11px] font-medium text-muted truncate">{roleLabel}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full mt-3 px-3 py-2 text-[13px] font-semibold text-danger hover:bg-danger-bg rounded-lg transition-colors flex items-center justify-center gap-2 border border-danger-border disabled:opacity-50 cursor-pointer"
              >
                {loggingOut ? (
                  <div className="w-3.5 h-3.5 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                )}
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}