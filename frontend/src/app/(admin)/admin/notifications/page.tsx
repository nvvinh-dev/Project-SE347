"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Pagination } from "@/components/ui/Pagination";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationResponse } from "@/types/notification";

function getNotificationCategory(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("sự cố") || lower.includes("tai nạn") || lower.includes("y tế")) {
    return {
      icon: "🩺",
      badgeText: "Sự cố y tế",
      badgeClass: "bg-danger-bg text-danger border-danger-border",
    };
  }
  if (lower.includes("phản ánh") || lower.includes("ý kiến") || lower.includes("đóng góp")) {
    return {
      icon: "💬",
      badgeText: "Ý kiến phụ huynh",
      badgeClass: "bg-info-bg text-info-text border-info-border",
    };
  }
  if (lower.includes("nghỉ học") || lower.includes("thông báo nghỉ")) {
    return {
      icon: "📢",
      badgeText: "Nghỉ học",
      badgeClass: "bg-warning-bg text-warning border-warning-border",
    };
  }
  return {
    icon: "🔔",
    badgeText: "Hệ thống",
    badgeClass: "bg-brand-subtle text-brand-text border-brand-border",
  };
}

function formatVietnamTime(utcString: string) {
  try {
    const d = new Date(utcString);
    if (isNaN(d.getTime())) return utcString;
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return utcString;
  }
}

export default function AdminNotificationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, isError, error, refetch } = useNotifications({
    page: currentPage,
    pageSize,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / pageSize)) : 1;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header trang thông báo */}
      <PageHeader
        title="Thông báo hệ thống"
        description="Danh sách thông báo, cảnh báo sự cố và cập nhật điều hành gửi đến Ban giám hiệu"
      />

      {/* 2. Nội dung danh sách thông báo */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-border shadow-2xs">
            <StatusMessage status="loading" message="Đang tải danh sách thông báo..." />
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-4 bg-card rounded-2xl border border-border shadow-2xs">
            <div className="p-4 rounded-xl bg-danger-bg border border-danger-border text-danger text-xs font-medium inline-block max-w-lg">
              <p className="font-bold">Không thể tải danh sách thông báo</p>
              <p className="mt-1">{error?.message ?? "Đã xảy ra lỗi khi kết nối máy chủ."}</p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 min-h-11 rounded-full text-xs font-semibold bg-background hover:bg-card border border-border text-foreground transition-all cursor-pointer"
              >
                Thử tải lại
              </button>
            </div>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-border shadow-2xs space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-brand-subtle text-brand flex items-center justify-center text-xl">
              ✨
            </div>
            <h3 className="text-sm font-bold text-foreground">Hộp thư thông báo đang trống</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Hiện tại nhà trường không có thông báo mới nào gửi đến Ban giám hiệu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted px-1">
              <span>
                Tổng số: <strong className="text-foreground font-semibold">{data.totalCount}</strong> thông báo
              </span>
              <span>Trang {data.page}/{totalPages}</span>
            </div>

            <div className="space-y-2.5">
              {data.items.map((item: NotificationResponse) => {
                const category = getNotificationCategory(item.message);
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-brand-border/60 hover:shadow-2xs transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{category.icon}</span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${category.badgeClass}`}
                        >
                          {category.badgeText}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted shrink-0 whitespace-nowrap">
                        {formatVietnamTime(item.createdAtUtc)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed pl-7 break-words wrap-anywhere min-w-0">
                      {item.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Phân trang */}
            {totalPages > 1 ? (
              <div className="pt-2">
                <Pagination
                  page={data.page}
                  pageSize={pageSize}
                  totalCount={data.totalCount}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
