"use client";

import { useAuth } from "@/context/AuthContext";

export default function AttendancePage() {
  const { user } = useAuth();
  const todayFormatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Ngày tháng — Chuẩn Monty */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-surface-line">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Điểm danh vào lớp
          </h1>
          <p className="text-sm text-ink-muted mt-1 capitalize">{todayFormatted}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-success-soft text-status-success text-xs font-semibold border border-status-success/20">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            Phiên điểm danh hôm nay
          </span>
        </div>
      </div>

      {/* Thông điệp khởi tạo module */}
      <div className="bg-white border border-surface-line rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 bg-brand-soft text-brand rounded-xl flex items-center justify-center mx-auto">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>

        <div className="max-w-lg mx-auto">
          <h2 className="text-base font-semibold text-ink">
            Khung Layout & Menu điều hướng Giáo viên đã sẵn sàng
          </h2>
          <p className="text-sm text-ink-muted mt-2 leading-relaxed">
            Xin chào <strong className="text-ink font-semibold">{user?.fullName || "Giáo viên"}</strong>.
            Giao diện bố cục đã được chuẩn hóa theo hệ màu và layout tiêu chuẩn Monty (Sidebar 272px, Desktop 1440px),
            sẵn sàng cho các khối thẻ và bảng điểm danh nghiệp vụ.
          </p>
        </div>
      </div>
    </div>
  );
}
