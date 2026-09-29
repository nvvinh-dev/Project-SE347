"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
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
  sidebarWidth = 272,
  onWidthChange,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isResizing, setIsResizing] = useState(false);

  const isItemActive = (href: string) => {
    if (href === "/attendance" && pathname === "/attendance") return true;
    if (href === "/health" && pathname === "/health") return true;
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  };

  // Xử lý kéo thả thay đổi độ rộng sidebar trên máy tính
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Giới hạn độ rộng từ 200px đến 380px
      const clampedWidth = Math.min(Math.max(e.clientX, 200), 380);
      onWidthChange?.(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [isResizing, onWidthChange]);

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleResetWidth = () => {
    onWidthChange?.(272);
  };

  return (
    <>
      {/* 1. SIDEBAR CỐ ĐỊNH TRÊN MÁY TÍNH (DESKTOP >= 1024px) - Chuẩn Monty: 272px */}
      <aside
        style={{
          width: isCollapsed ? "72px" : `${sidebarWidth}px`,
        }}
        className={`hidden lg:flex flex-col fixed top-16 left-0 bottom-0 bg-white border-r border-surface-line z-30 transition-[width] duration-200 ease-in-out overflow-x-hidden ${
          isResizing ? "transition-none" : ""
        }`}
      >
        {/* Danh sách liên kết điều hướng: Bắt đầu ngay từ đỉnh thanh bên, tối ưu 100% diện tích */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 pt-3 space-y-1 [scrollbar-width:thin] [scrollbar-color:#E7E6ED_transparent]">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                    isCollapsed ? "justify-center p-3" : "justify-between px-3 py-2.5"
                  } ${
                    active
                      ? "bg-brand-soft text-brand font-semibold"
                      : "text-ink-muted hover:text-ink hover:bg-surface"
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} min-w-0`}>
                    <span className={`w-5 h-5 shrink-0 ${active ? "text-brand" : "text-ink-subtle"}`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span className="text-[11px] font-semibold bg-status-danger-soft text-status-danger px-2 py-0.5 rounded-full border border-status-danger/20 shrink-0 ml-2">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Chân sidebar: Tích hợp thông tin hệ thống và Nút thu gọn / mở rộng tiện dụng */}
        <div className="p-3 pb-8 border-t border-surface-line bg-white shrink-0 overflow-hidden">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                id="sidebar-collapse-btn"
                onClick={onToggleCollapse}
                title="Mở rộng thanh bên"
                className="p-1.5 rounded-lg text-ink-subtle hover:text-brand hover:bg-surface transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
              <span className="text-[10px] font-semibold text-ink-subtle">v1.0</span>
            </div>
          ) : (
            <div className="flex items-center justify-between pl-1">
              <div className="min-w-0 pr-2">
                <p className="text-[11px] text-ink font-medium truncate whitespace-nowrap">
                  Hệ thống QL Nhà Trẻ v1.0
                </p>
                <p className="text-[10px] text-ink-subtle truncate whitespace-nowrap">{portalName}</p>
              </div>
              <button
                type="button"
                id="sidebar-collapse-btn"
                onClick={onToggleCollapse}
                title="Thu gọn thanh bên"
                className="p-1.5 rounded-lg text-ink-subtle hover:text-brand hover:bg-surface transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Thanh tay cầm kéo để chỉnh độ rộng trên desktop (chỉ hiện khi đang mở rộng) */}
        {!isCollapsed && (
          <div
            onMouseDown={handleStartResize}
            onDoubleClick={handleResetWidth}
            title="Kéo để chỉnh độ rộng thanh bên (Nhấp đúp để đặt lại 272px chuẩn Monty)"
            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand/50 active:bg-brand transition-colors z-40 group select-none"
          >
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-6 rounded-full bg-surface-line group-hover:bg-brand transition-colors" />
          </div>
        )}
      </aside>

      {/* 2. DRAWER CHO MÀN HÌNH NHỎ (MOBILE & TABLET < 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Lớp mờ nền (Click vào để đóng) */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Khung trượt menu (Slide-over drawer) */}
          <div className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white p-4 flex flex-col justify-between shadow-xl z-10 animate-in slide-in-from-left duration-200 overflow-x-hidden border-r border-surface-line">
            <div>
              {/* Header drawer */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-line">
                <div>
                  <h2 className="font-semibold text-ink text-sm">Menu Điều Hướng</h2>
                  <p className="text-xs text-ink-muted">{portalName}</p>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 text-ink-subtle hover:text-ink hover:bg-surface rounded-lg transition-colors cursor-pointer"
                  aria-label="Đóng menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Danh sách link mobile */}
              <div className="overflow-y-auto max-h-[calc(100vh-140px)] space-y-1">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const active = isItemActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "bg-brand-soft text-brand font-semibold"
                            : "text-ink-muted hover:text-ink hover:bg-surface"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-5 h-5 shrink-0 ${active ? "text-brand" : "text-ink-subtle"}`}>
                            {item.icon}
                          </span>
                          <span className="truncate whitespace-nowrap">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[11px] font-semibold bg-status-danger-soft text-status-danger px-2 py-0.5 rounded-full border border-status-danger/20 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Chân menu mobile */}
            <div className="pt-3 border-t border-surface-line text-center">
              <p className="text-[11px] text-ink-subtle">© 2026 Quản Lý Nhà Trẻ</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

