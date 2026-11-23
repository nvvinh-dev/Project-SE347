"use client";

import React, { useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Button } from "@/components/ui/Button";
import { useAbsenceEscalations } from "@/hooks/useAbsenceEscalations";
import { toApiError } from "@/lib/axios";
import type { AbsenceFollowUpResponse, AbsenceEscalationResponse } from "@/types/attendance";

/**
 * Định dạng thời gian theo chuẩn giờ Việt Nam (UTC+7)
 */
function formatVietnamDateTime(utcString: string): string {
  try {
    const d = new Date(utcString);
    if (isNaN(d.getTime())) return utcString;
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch {
    return utcString;
  }
}

/**
 * Lấy nhãn và lớp CSS pastel cho kết quả liên hệ (D39 mục 20, UI_DESIGN_GUIDELINES)
 */
function getOutcomeBadge(outcome: string) {
  switch (outcome) {
    case "Unreachable":
      return {
        label: "Không liên lạc được",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        dotClass: "bg-rose-500",
      };
    case "Reached":
      return {
        label: "Đã liên lạc được",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-500",
      };
    default:
      return {
        label: outcome,
        badgeClass: "bg-muted/10 text-muted border-border",
        dotClass: "bg-muted",
      };
  }
}

/**
 * Lấy badge lớp học pastel theo khối (Mầm / Chồi / Lá)
 */
function getClassBadgeClass(className: string): string {
  const lower = className.toLowerCase();
  if (lower.includes("mầm")) {
    return "bg-brand-subtle text-brand-text border-brand-border";
  }
  if (lower.includes("chồi")) {
    return "bg-info-bg text-info border-info-border";
  }
  if (lower.includes("lá")) {
    return "bg-warning-bg text-warning border-warning-border";
  }
  return "bg-muted/10 text-muted border-border";
}

/**
 * Lấy trạng thái tổng quan hiện tại của trẻ cần xử lý
 */
function getEscalationStatus(followUps: AbsenceFollowUpResponse[]) {
  if (followUps.length === 0) {
    return {
      statusLabel: "Chưa liên hệ (quá 10:00)",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      dotClass: "bg-amber-500",
    };
  }

  const latest = followUps[followUps.length - 1];
  if (latest.outcome === "Unreachable") {
    return {
      statusLabel: "Không liên lạc được",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      dotClass: "bg-rose-500",
    };
  }

  return {
    statusLabel: "Đã liên lạc được",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
  };
}

export default function AdminAbsenceEscalationsPage() {
  const { data: escalations, isLoading, isError, error, refetch, isFetching } = useAbsenceEscalations();

  // Thống kê nhanh số ca cần xử lý
  const summary = useMemo(() => {
    if (!escalations) return { total: 0, uncontacted: 0, unreachable: 0 };
    let uncontacted = 0;
    let unreachable = 0;

    for (const item of escalations) {
      if (item.followUps.length === 0) {
        uncontacted++;
      } else if (item.followUps[item.followUps.length - 1].outcome === "Unreachable") {
        unreachable++;
      }
    }

    return {
      total: escalations.length,
      uncontacted,
      unreachable,
    };
  }, [escalations]);

  const todayDisplay = useMemo(() => {
    return new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <PageHeader
        title="Trẻ vắng không phép cần xử lý"
        description="Danh sách trẻ vắng không phép hôm nay cần Ban giám hiệu theo dõi và phối hợp xử lý liên hệ khẩn cấp."
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border/60 bg-brand-subtle/50 text-brand-text text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            {todayDisplay}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl border-border/80 hover:bg-card shadow-xs"
          >
            <svg
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-brand" : "text-muted"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isFetching ? "Đang tải..." : "Làm mới"}</span>
          </Button>
        </div>
      </PageHeader>

      {/* Thông báo nghiệp vụ quan trọng: Chỉ theo dõi, xử lý ngoài hệ thống (D39 mục 20, D40 mục 3) */}
      <div className="rounded-2xl border border-brand-border/50 bg-brand-subtle/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-brand-dark">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand/10 text-brand shrink-0 mt-0.5 sm:mt-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Giám sát xử lý vắng không phép theo thời gian thực</p>
            <p className="text-muted text-xs mt-0.5 leading-relaxed">
              Theo quy định nhà trường, trường hợp giáo viên không liên lạc được hoặc sau 10:00 chưa có liên hệ sẽ hiển thị tại đây.
              Ban giám hiệu trực tiếp phối hợp gọi điện hoặc xử lý hỗ trợ bên ngoài hệ thống.
            </p>
          </div>
        </div>
      </div>

      {/* Thẻ thống kê tổng hợp (Kawaii Pastel Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-medium text-muted">Tổng số trường hợp cần xử lý</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{summary.total}</span>
            <span className="text-xs text-muted">trẻ hôm nay</span>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-medium text-rose-700">Không liên lạc được (Unreachable)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-700 tracking-tight">{summary.unreachable}</span>
            <span className="text-xs text-rose-600">cần BGH hỗ trợ gọi</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-medium text-amber-800">Chưa liên hệ (sau 10:00)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-800 tracking-tight">{summary.uncontacted}</span>
            <span className="text-xs text-amber-700">cần nhắc giáo viên lớp</span>
          </div>
        </div>
      </div>

      {/* 3 trạng thái giao diện: Đang tải / Lỗi / Rỗng (AC-NFR-04) */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 animate-pulse shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-36 bg-muted/20 rounded-lg" />
                <div className="h-5 w-20 bg-muted/20 rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-muted/15 rounded-md" />
                <div className="h-4 w-4/5 bg-muted/15 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <StatusMessage
          status="error"
          title="Không thể tải danh sách trẻ vắng cần xử lý"
          message={toApiError(error).message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (!escalations || escalations.length === 0) && (
        <StatusMessage
          status="empty"
          title="Hôm nay không có trường hợp vắng không phép cần xử lý"
          message="Tuyệt vời! Tất cả các trẻ vắng không phép hôm nay đã được giáo viên liên hệ thành công hoặc chưa có ca nào quá hạn 10:00 sáng."
        />
      )}

      {/* Danh sách thẻ trẻ vắng cần xử lý */}
      {!isLoading && !isError && escalations && escalations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {escalations.map((item: AbsenceEscalationResponse, index: number) => {
            const overallStatus = getEscalationStatus(item.followUps);
            return (
              <div
                key={`${item.childFullName}-${item.className}-${index}`}
                className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs hover:border-brand-border/60 transition-all"
              >
                <div>
                  {/* Tiêu đề thẻ: Họ tên trẻ & Lớp & Trạng thái hiện tại */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-border/50">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                        {item.childFullName}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getClassBadgeClass(
                            item.className
                          )}`}
                        >
                          Lớp {item.className}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${overallStatus.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${overallStatus.dotClass}`} />
                      {overallStatus.statusLabel}
                    </span>
                  </div>

                  {/* Lịch sử các lần liên hệ của giáo viên */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                      Lịch sử liên hệ ({item.followUps.length} lần)
                    </p>

                    {item.followUps.length === 0 ? (
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                        <span className="text-amber-500 font-bold shrink-0 mt-0.5">⚠️</span>
                        <div>
                          <p className="font-semibold">Chưa có liên hệ nào từ giáo viên</p>
                          <p className="mt-0.5 text-amber-800">
                            Đã quá 10:00 sáng theo giờ Việt Nam nhưng chưa ghi nhận cuộc gọi nào từ giáo viên phụ trách lớp.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative pl-5 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70">
                        {item.followUps.map((fu: AbsenceFollowUpResponse, fIndex: number) => {
                          const outcomeInfo = getOutcomeBadge(fu.outcome);
                          const isLatest = fIndex === item.followUps.length - 1;

                          return (
                            <div key={fIndex} className="relative text-xs">
                              {/* Nút điểm mốc trên timeline */}
                              <div
                                className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full border-2 border-card ${
                                  isLatest ? outcomeInfo.dotClass : "bg-muted"
                                }`}
                              />

                              <div className="rounded-xl border border-border/60 bg-background/50 p-3 space-y-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${outcomeInfo.badgeClass}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${outcomeInfo.dotClass}`} />
                                    {outcomeInfo.label}
                                  </span>
                                  <time className="text-[11px] font-medium text-muted">
                                    {formatVietnamDateTime(fu.recordedAtUtc)}
                                  </time>
                                </div>

                                <div className="flex items-center gap-1 text-[11px] text-muted">
                                  <span>Giáo viên:</span>
                                  <span className="font-medium text-foreground">{fu.recordedByTeacherName}</span>
                                </div>

                                {fu.note ? (
                                  <div className="mt-1.5 rounded-lg bg-card border border-border/40 p-2 text-foreground font-medium text-xs leading-relaxed">
                                    <span className="text-muted mr-1 font-normal">Ghi chú:</span>
                                    {fu.note}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-muted/70 italic mt-0.5">
                                    (Không có ghi chú thêm)
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Nhắc nhở quy tắc ở chân thẻ */}
                <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted">
                  <span>Chỉ xem theo dõi • Dữ liệu hôm nay</span>
                  <span className="text-[11px] font-medium text-brand-dark">Quy định FR-ATT-04</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
