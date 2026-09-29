"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/config/navigation";
import { NavIcon } from "./NavIcon";

interface MobileNavProps {
  items: NavItem[];
  roleLabel: string;
  userName: string;
  onLogout: () => void;
}

export function MobileNav({ items, roleLabel, userName, onLogout }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E8E8EC] flex items-center justify-between px-4 sm:px-6 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#42B591] flex items-center justify-center shadow-xs">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
          </div>
          <span className="text-sm font-bold text-[#16141F]">Mầm Non Sao Mai</span>
          <span className="text-[10px] font-semibold bg-[#F0FAF6] text-[#247A60] px-2 py-0.5 rounded-full border border-[#C4EDE0]">{roleLabel}</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#F3F2F7] text-[#16141F] transition-colors"
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
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="h-16 px-6 flex items-center gap-3 border-b border-[#E8E8EC]">
              <div className="w-8 h-8 rounded-lg bg-[#42B591] flex items-center justify-center shadow-xs">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#16141F]">Mầm Non Sao Mai</span>
                <span className="text-[11px] font-semibold text-[#247A60]">{roleLabel}</span>
              </div>
            </div>

            {/* Nav list */}
            <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
              {items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                      active ? "bg-[#42B591] text-white shadow-xs" : "text-[#6A677B] hover:bg-[#F0FAF6] hover:text-[#247A60]"
                    }`}
                  >
                    <NavIcon name={item.icon} className={`w-[18px] h-[18px] ${active ? "text-white" : "text-[#6A677B]"}`} />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[#E8E8EC] bg-white">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F9F9FB] border border-[#E8E8EC]">
                <div className="w-8 h-8 rounded-full bg-[#42B591] text-white text-xs font-bold flex items-center justify-center">
                  {userName.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#16141F] truncate">{userName}</p>
                  <p className="text-[11px] font-medium text-[#6A677B] truncate">{roleLabel}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full mt-3 px-3 py-2 text-[13px] font-semibold text-[#E5484D] hover:bg-[#FEF2F2] rounded-lg transition-colors flex items-center justify-center gap-2 border border-[#FEE2E2]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}