"use client";

import { useAuth } from "@/context/AuthContext";

export default function MedicalHealthPage() {
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
            Theo dõi thể chất học sinh
          </h1>
          <p className="text-sm text-ink-muted mt-1 capitalize">{todayFormatted}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-success-soft text-status-success text-xs font-semibold border border-status-success/20">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            Hồ sơ thể chất toàn trường
          </span>
        </div>
      </div>

      {/* Thông điệp khởi tạo module */}
      <div className="bg-white border border-surface-line rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 bg-status-success-soft text-status-success rounded-xl flex items-center justify-center mx-auto">
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
              d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div className="max-w-lg mx-auto">
          <h2 className="text-base font-semibold text-ink">
            Khung Layout & Menu điều hướng Y tế đã sẵn sàng
          </h2>
          <p className="text-sm text-ink-muted mt-2 leading-relaxed">
            Xin chào <strong className="text-ink font-semibold">{user?.fullName || "Cán bộ Y tế"}</strong>.
            Giao diện đã được thiết lập đúng phạm vi quyền hạn toàn trường về sức khỏe (không xem
            điểm danh, không xem phân lớp theo D40), sẵn sàng cho các chức năng ghi nhận chiều cao,
            cân nặng và lưu ý sức khỏe theo chuẩn thiết kế Monty.
          </p>
        </div>
      </div>
    </div>
  );
}
