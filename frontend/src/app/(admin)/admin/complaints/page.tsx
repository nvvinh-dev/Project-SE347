"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Pagination } from "@/components/ui/Pagination";
import { ComplaintHandlingModal } from "@/components/admin/complaints/ComplaintHandlingModal";
import { useComplaints } from "@/hooks/useComplaints";
import {
  type ComplaintResponse,
  type ComplaintStatus,
  COMPLAINT_STATUS_LABELS,
} from "@/types/complaint";

type FilterTab = "New" | "InProgress" | "Resolved" | "All";

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

function getStatusBadge(status: ComplaintStatus) {
  const label = COMPLAINT_STATUS_LABELS[status] ?? status;
  switch (status) {
    case "New":
      return {
        label,
        badgeClass: "bg-warning-bg text-warning border-warning-border",
        dotColor: "bg-warning",
      };
    case "InProgress":
      return {
        label,
        badgeClass: "bg-info-bg text-info border-info-border",
        dotColor: "bg-info",
      };
    case "Resolved":
      return {
        label,
        badgeClass: "bg-brand-subtle text-brand-text border-brand-border",
        dotColor: "bg-brand",
      };
    default:
      return {
        label,
        badgeClass: "bg-muted/10 text-muted border-border",
        dotColor: "bg-muted",
      };
  }
}

function getClassBadge(className: string | null) {
  if (!className) {
    return "bg-muted/10 text-muted border-border";
  }
  const lower = className.toLowerCase();
  if (lower.includes("mầm")) {
    return "bg-brand-subtle text-brand-text border-brand-border";
  }
  if (lower.includes("chồi")) {
    return "bg-info-bg text-info border-info-border";
  }
  return "bg-warning-bg text-warning border-warning-border";
}

export default function AdminComplaintsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("New");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintResponse | null>(null);

  const pageSize = 10;

  const { data, isLoading, isError, error, refetch } = useComplaints({
    status: activeTab === "All" ? undefined : activeTab,
    page: currentPage,
    pageSize,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / pageSize)) : 1;

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "New", label: COMPLAINT_STATUS_LABELS.New },
    { key: "InProgress", label: COMPLAINT_STATUS_LABELS.InProgress },
    { key: "Resolved", label: COMPLAINT_STATUS_LABELS.Resolved },
    { key: "All", label: "Tất cả" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Xử lý phản ánh từ phụ huynh"
        description="Tiếp nhận, theo dõi và phản hồi các ý kiến đóng góp, phản ánh của phụ huynh học sinh"
      />

      {/* 2. Bộ lọc Tabs theo trạng thái (không đếm số lượng do backend chỉ trả totalCount theo tab hiện tại) */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto select-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer min-h-11 ${
                isActive
                  ? "bg-brand text-white shadow-2xs"
                  : "bg-card text-muted hover:text-foreground hover:bg-background border border-border"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Danh sách phản ánh */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-border shadow-2xs">
            <StatusMessage status="loading" message="Đang tải danh sách phản ánh..." />
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-4 bg-card rounded-2xl border border-border shadow-2xs">
            <div className="p-4 rounded-xl bg-danger-bg border border-danger-border text-danger text-xs font-medium inline-block max-w-lg">
              <p className="font-bold">Không thể tải danh sách phản ánh</p>
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
              🌿
            </div>
            <h3 className="text-sm font-bold text-foreground">Không có phản ánh nào</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {activeTab === "New"
                ? "Tuyệt vời! Hiện tại không có phản ánh mới nào đang chờ tiếp nhận."
                : activeTab === "InProgress"
                  ? "Không có phản ánh nào đang trong quá trình xử lý."
                  : activeTab === "Resolved"
                    ? "Chưa có phản ánh nào trong danh mục đã xử lý xong."
                    : "Hiện tại trường chưa ghi nhận phản ánh nào từ phụ huynh."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted px-1">
              <span>
                Tìm thấy <strong className="text-foreground font-semibold">{data.totalCount}</strong> phản ánh
              </span>
              <span>Trang {data.page}/{totalPages}</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {data.items.map((complaint: ComplaintResponse) => {
                const statusBadge = getStatusBadge(complaint.status);
                const classBadge = getClassBadge(complaint.className);
                const initial = complaint.childFullName?.charAt(0)?.toUpperCase() || "B";
                const isResolved = complaint.status === "Resolved";

                return (
                  <div
                    key={complaint.id}
                    className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-2xs hover:border-brand-border/60 transition-all space-y-4"
                  >
                    {/* Header Thẻ Phản ánh */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar pastel */}
                        <div className="w-10 h-10 rounded-full bg-brand-subtle text-brand-text flex items-center justify-center text-sm font-bold shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground truncate">
                              Bé {complaint.childFullName}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${classBadge}`}
                            >
                              {complaint.className ? `Lớp ${complaint.className}` : "Chưa xếp lớp"}
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-0.5">
                            Phụ huynh gửi:{" "}
                            <strong className="text-foreground">{complaint.submittedByFullName}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Trạng thái & Thời gian gửi */}
                      <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${statusBadge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
                          <span>{statusBadge.label}</span>
                        </span>
                        <span className="text-[11px] text-muted whitespace-nowrap">
                          {formatVietnamTime(complaint.createdAtUtc)}
                        </span>
                      </div>
                    </div>

                    {/* Nội dung phản ánh */}
                    <div className="space-y-3">
                      <div className="text-xs sm:text-sm text-foreground leading-relaxed break-words wrap-anywhere min-w-0 bg-background/60 p-4 rounded-xl border border-border">
                        <p className="font-semibold text-muted text-[11px] uppercase tracking-wider mb-1">
                          Nội dung phản ánh:
                        </p>
                        <p className="whitespace-pre-wrap break-words wrap-anywhere">{complaint.content}</p>
                      </div>

                      {/* Kết quả xử lý nếu đã có */}
                      {complaint.resolution ? (
                        <div className="p-4 rounded-xl bg-brand-subtle/40 border border-brand-border/60 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-brand-text font-bold text-[11px] uppercase tracking-wider flex-wrap gap-1">
                            <span>Biện pháp &amp; Kết quả xử lý:</span>
                            {complaint.resolvedAtUtc ? (
                              <span className="text-[11px] font-medium text-muted lowercase">
                                lúc {formatVietnamTime(complaint.resolvedAtUtc)}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed break-words wrap-anywhere min-w-0">
                            {complaint.resolution}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {/* Footer Thẻ: Nút hành động (ẩn khi đã Resolved vì backend chặn 409) */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand">
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Đã hoàn tất xử lý</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedComplaint(complaint)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-11 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            complaint.status === "New"
                              ? "bg-brand hover:bg-brand-hover text-white shadow-2xs"
                              : "bg-background hover:bg-card border border-border text-foreground"
                          }`}
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>
                            {complaint.status === "New"
                              ? "Tiếp nhận & Xử lý"
                              : "Cập nhật kết quả"}
                          </span>
                        </button>
                      )}
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
                  pageSize={data.pageSize}
                  totalCount={data.totalCount}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* 4. Modal Xử lý Phản ánh */}
      {selectedComplaint ? (
        <ComplaintHandlingModal
          key={selectedComplaint.id}
          complaint={selectedComplaint}
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
        />
      ) : null}
    </div>
  );
}
