"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Pagination } from "@/components/ui/Pagination";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationResponse } from "@/types/notifications";

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
      {/* 1. Header trang thông báo (FR-NOTI-04) */}
      <PageHeader
        title="Thông báo hệ thống"
        description="Danh sách thông báo in-app gửi đến Ban giám hiệu"
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
              🔔
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
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-brand-border/60 hover:shadow-2xs transition-all flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-subtle text-brand flex items-center justify-center text-base shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">
                          Thông báo điều hành
                        </span>
                        <span className="text-[11px] text-muted whitespace-nowrap">
                          {formatVietnamTime(item.createdAtUtc)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed break-words wrap-anywhere min-w-0">
                        {item.message}
                      </p>
                    </div>
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
