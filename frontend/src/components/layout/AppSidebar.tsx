"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColorClass?: string;
}

interface AppSidebarProps {
  portalName: string;
  navItems: NavItem[];
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  sidebarWidth?: number;
  onWidthChange?: (width: number) => void;
}

export default function AppSidebar({
  portalName,
  navItems,
  mobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  sidebarWidth = 256,
  onWidthChange,
}: AppSidebarProps) {
  const pathname = usePathname();
  const isResizing = useRef(false);

  // Kéo thả thay đổi độ rộng sidebar trên desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const clamped = Math.min(Math.max(e.clientX, 200), 380);
      onWidthChange?.(clamped);
    };

    const handleMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onWidthChange]);

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleResetWidth = () => onWidthChange?.(256);

  const isItemActive = (href: string) => {
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  };

  const renderNavList = () => (
    <nav>
      <ul className="space-y-1">
        {navItems.map((item) => {
          const active = isItemActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  isCollapsed ? "justify-center p-3" : "justify-between px-3 py-2.5"
                } ${
                  active
                    ? "bg-brand text-white shadow-xs font-semibold"
                    : "text-ink-muted hover:text-ink hover:bg-surface"
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} min-w-0`}>
                  <span className={`w-5 h-5 shrink-0 ${active ? "text-white" : "text-ink-subtle"}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>
                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${
                      active
                        ? "bg-white/20 text-white border-white/30"
                        : (item.badgeColorClass || "bg-brand-soft text-brand border-brand/20")
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      {/* SIDEBAR CỐ ĐỊNH TRÊN DESKTOP (>= 1024px) */}
      <aside
        style={{ width: isCollapsed ? "72px" : `${sidebarWidth}px` }}
        className="hidden lg:flex flex-col fixed top-16 left-0 bottom-0 bg-white border-r border-slate-200 z-30"
      >
        {/* Inner wrapper: full height flex column — sidebar kéo từ top-16 đến bottom-0 */}
        <div className="flex flex-col h-full overflow-hidden">
        {/* Danh sách điều hướng */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:thin] [scrollbar-color:#E5E9E7_transparent]">
          {renderNavList()}
        </div>

        {/* Chân sidebar dưới cùng bên trái: Thẻ Online + Nút đóng mở "<" và ">" */}
        <div className="mt-auto border-t border-slate-200 shrink-0 bg-slate-50/90 select-none">
          {isCollapsed ? (
            <div className="p-2.5 flex flex-col items-center justify-center gap-2">
              {/* Chấm Online khi thu gọn */}
              <div
                className="relative flex h-2.5 w-2.5 my-0.5"
                title="Hệ thống: Online"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white"></span>
              </div>

              <button
                type="button"
                id="sidebar-expand-btn"
                onClick={onToggleCollapse}
                title="Mở rộng menu (Trạng thái: Online)"
                aria-label="Mở rộng menu"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs group"
              >
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="p-3 flex items-center justify-between gap-2">
              {/* Thẻ Online góc trái dưới cùng */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-xs font-medium shadow-2xs select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-xs tracking-wide">Online</span>
              </div>

              {/* Nút thu gọn với icon "<" */}
              <button
                type="button"
                id="sidebar-collapse-btn"
                onClick={onToggleCollapse}
                title="Thu gọn menu (<)"
                aria-label="Thu gọn menu"
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-2xs group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
        </div>
        {/* Kết thúc inner wrapper */}

        {/* Thanh kéo thay đổi độ rộng — absolute relative to aside, không bị overflow-hidden cắt */}
        {!isCollapsed && (
          <div
            onMouseDown={handleStartResize}
            onDoubleClick={handleResetWidth}
            title="Kéo để thay đổi độ rộng · Nhấp đúp để đặt lại"
            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize group z-10 select-none"
          >
            <div className="absolute inset-y-0 right-0 w-1.5 bg-transparent group-hover:bg-brand/20 group-active:bg-brand/40 transition-colors" />
            <div className="absolute top-1/2 -translate-y-1/2 right-0.5 w-1 h-8 rounded-full bg-surface-line group-hover:bg-brand/50 group-active:bg-brand transition-colors" />
          </div>
        )}
      </aside>

      {/* DRAWER CHO MOBILE / TABLET (< 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white flex flex-col shadow-xl z-10 border-r border-surface-line">
            {/* Header drawer */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-line">
              <div>
                <p className="font-bold text-ink-heading text-sm">Mầm Non Sao Mai</p>
                <p className="text-xs text-ink-muted">{portalName}</p>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 text-ink-subtle hover:text-ink hover:bg-surface rounded-lg transition-colors cursor-pointer"
                aria-label="Đóng menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Danh sách điều hướng */}
            <div className="flex-1 overflow-y-auto p-3">
              {renderNavList()}
            </div>

            {/* Chân drawer trên di động: Thẻ Online */}
            <div className="p-3 border-t border-slate-200 shrink-0 bg-slate-50/90 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-xs tracking-wide">Online</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Hệ thống sẵn sàng</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
