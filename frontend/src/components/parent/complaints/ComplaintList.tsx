"use client";

import { useState } from "react";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { Pagination } from "@/components/ui/Pagination";
import { StatusMessage } from "@/components/ui/StatusMessage";
import type { useChildComplaints } from "@/hooks/useComplaints";
import { cn } from "@/lib/utils";
import { COMPLAINT_STATUS_LABELS, type ChildComplaintResponse, type ComplaintStatus } from "@/types/complaint";

const PAGE_SIZE = 10;

const STATUS_CLASSES: Record<ComplaintStatus, string> = {
  New: "border-info-border bg-info-bg text-info-text",
  InProgress: "border-warning-border bg-warning-bg text-amber-800",
  Resolved: "border-brand-border bg-brand-subtle text-brand-text",
};

// Viền trái theo trạng thái để lướt danh sách là nhận ra phản ánh nào còn chờ.
const ACCENT_CLASSES: Record<ComplaintStatus, string> = {
  New: "border-l-info",
  InProgress: "border-l-warning",
  Resolved: "border-l-brand",
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
});

function formatDateTime(utc: string | null) {
  const time = utc ? Date.parse(utc) : NaN;
  return Number.isFinite(time) ? dateTimeFormatter.format(time) : null;
}

function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
      STATUS_CLASSES[status] ?? "border-border bg-background text-muted",
    )}>
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {COMPLAINT_STATUS_LABELS[status] ?? "Chưa xác định"}
    </span>
  );
}

function ComplaintItem({ complaint }: { complaint: ChildComplaintResponse }) {
  const sentAt = formatDateTime(complaint.createdAtUtc);
  const resolvedAt = formatDateTime(complaint.resolvedAtUtc);

  return (
    <li className={cn("overflow-hidden rounded-xl border border-border border-l-4 bg-card", ACCENT_CLASSES[complaint.status])}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-background/40 px-4 py-2.5">
        <ComplaintStatusBadge status={complaint.status} />
        {sentAt && (
          <p className="text-xs text-muted">
            Gửi lúc <time dateTime={complaint.createdAtUtc} className="font-medium tabular-nums text-foreground/80">{sentAt}</time>
          </p>
        )}
      </div>
      <div className="space-y-3 px-4 py-3.5">
        {/* Văn bản thuần: React tự thoát ký tự HTML, giữ xuống dòng như phụ huynh đã nhập. */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">{complaint.content}</p>
        {complaint.status === "Resolved" && (
          <div className="flex gap-3 rounded-lg bg-brand-subtle px-3 py-3">
            <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 13 4 4L19 7" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand-text">Ban giám hiệu đã phản hồi</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
                {complaint.resolution?.trim() || "Ban giám hiệu chưa ghi kết quả."}
              </p>
              {resolvedAt && (
                <p className="mt-1.5 text-xs text-muted">
                  Xử lý xong lúc <time dateTime={complaint.resolvedAtUtc ?? undefined} className="tabular-nums">{resolvedAt}</time>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

interface ComplaintListProps {
  childName: string;
  complaints: ReturnType<typeof useChildComplaints>;
}

/** Danh sách phản ánh của một trẻ, mới nhất trước (API đã sắp). */
export function ComplaintList({ childName, complaints }: ComplaintListProps) {
  const [page, setPage] = useState(1);
  // Lỗi tạm thời giữ dữ liệu cũ; trẻ không còn liên kết (404) hoặc mất quyền (403) thì ẩn hết.
  const hasVisibleData = complaints.data !== undefined
    && complaints.error?.status !== 403 && complaints.error?.status !== 404;
  const records = hasVisibleData ? complaints.data ?? [] : [];
  const safePage = Math.min(page, Math.max(1, Math.ceil(records.length / PAGE_SIZE)));
  const start = (safePage - 1) * PAGE_SIZE;

  return (
    <section aria-labelledby="complaint-list-title" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-4 sm:px-5">
        <h2 id="complaint-list-title" className="min-w-0 text-base font-semibold text-foreground [overflow-wrap:anywhere]">
          Phản ánh về bé {childName}
        </h2>
        {hasVisibleData && records.length > 0 && (
          <p className="text-xs text-muted tabular-nums sm:text-sm">{records.length} phản ánh</p>
        )}
      </div>

      {complaints.isError && hasVisibleData && (
        <RefreshErrorNotice
          className="border-b border-warning-border px-4 py-3 sm:px-5"
          message={complaints.error.message}
          isFetching={complaints.isFetching}
          onRetry={() => { void complaints.refetch(); }}
        />
      )}

      <div aria-busy={complaints.isFetching}>
        {complaints.isLoading ? (
          <div role="status"><StatusMessage status="loading" title="Đang tải danh sách phản ánh…" /></div>
        ) : complaints.isError && !hasVisibleData ? (
          <div role="alert" className="p-4 sm:p-5">
            <StatusMessage status="error" title="Không thể tải danh sách phản ánh" message={complaints.error.message}
              onRetry={() => { void complaints.refetch(); }} />
          </div>
        ) : records.length === 0 ? (
          <div className="p-4 sm:p-5">
            <StatusMessage status="empty" title="Chưa có phản ánh nào"
              message="Các phản ánh đã gửi về bé sẽ hiện ở đây cùng trạng thái xử lý." />
          </div>
        ) : (
          <ul className="space-y-3 p-3 sm:p-4">
            {records.slice(start, start + PAGE_SIZE).map((complaint) => (
              <ComplaintItem key={complaint.id} complaint={complaint} />
            ))}
          </ul>
        )}
      </div>

      {records.length > PAGE_SIZE && (
        <Pagination
          page={safePage}
          pageSize={PAGE_SIZE}
          totalCount={records.length}
          onPageChange={setPage}
          showSummary={false}
          className="justify-end! border-t border-border px-4 py-4! [&_nav]:max-w-full [&_nav]:flex-wrap sm:px-5"
        />
      )}
    </section>
  );
}
