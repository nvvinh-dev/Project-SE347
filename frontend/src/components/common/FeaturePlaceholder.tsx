"use client";

import React from "react";

interface FeaturePlaceholderProps {
  title: string;
  featureCode: string;
  roleName: string;
  description: string;
  icon?: React.ReactNode;
}

/**
 * Component trang giữ chỗ ngắn gọn chuẩn mực cho thẻ Layout + Menu điều hướng
 * Tuân thủ quy định nghiệm thu: Chỉ hiển thị tiêu đề và thông báo "Đang chờ API backend".
 */
export default function FeaturePlaceholder({
  title,
  featureCode,
  roleName,
  description,
  icon,
}: FeaturePlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Trạng thái */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-surface-line">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Mã nghiệp vụ: <span className="font-semibold text-ink">{featureCode}</span> · Phân hệ: <span className="font-semibold text-ink">{roleName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Đang chờ API backend
          </span>
        </div>
      </div>

      {/* Khung giữ chỗ ngắn gọn */}
      <div className="bg-white border border-surface-line rounded-2xl p-6 sm:p-10 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 bg-brand-soft text-brand rounded-2xl flex items-center justify-center mx-auto text-2xl">
          {icon || "🚧"}
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-base font-semibold text-ink">
            Giao diện đang chờ API backend hoàn thiện
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            {description}
          </p>
          <div className="pt-2">
            <span className="inline-block text-[11px] font-medium text-ink-subtle bg-surface px-3 py-1 rounded-full border border-surface-line">
              Khung Layout & Menu điều hướng đã sẵn sàng kết nối API
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
