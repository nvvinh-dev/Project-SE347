"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useNotifications } from "@/hooks/useNotifications";
import { formatMeasurementDate, formatMeasurementDateTime } from "@/lib/growth-measurements";
import { SCHOOL_CLOSURE_PREFIX, type NotificationResponse } from "@/types/notifications";

const PAGE_SIZE = 20;
const BELL_ICON = "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";

/** Gom thông báo của trang hiện tại theo ngày nhận, giữ thứ tự mới nhất trước của API. */
function groupByDay(items: NotificationResponse[]) {
  const groups: { day: string; items: NotificationResponse[] }[] = [];
  for (const item of items) {
    const day = formatMeasurementDate(item.createdAtUtc);
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}

export default function ParentNotificationsPage() {
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);
  const query = useNotifications({ page, pageSize: PAGE_SIZE });
  const data = query.data;
  const items = data?.items ?? [];

  const changePage = (next: number) => {
    setPage(next);
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div ref={topRef} className="min-w-0 scroll-mt-4 space-y-5">
      <PageHeader
        title="Thông báo từ nhà trường"
        description="Thông báo nghỉ học, hóa đơn, sức khỏe, ảnh hoạt động và phản hồi gửi đến phụ huynh"
      >
        <Button variant="secondary" size="sm" className="min-h-10" disabled={query.isFetching}
          onClick={() => { void query.refetch(); }}>
          {query.isFetching ? "Đang tải..." : "Tải lại"}
        </Button>
      </PageHeader>

      {query.isError && data && (
        <div className="overflow-hidden rounded-xl border border-warning-border">
          <RefreshErrorNotice className="px-4 py-3 sm:px-6" message={query.error.message}
            isFetching={query.isFetching} onRetry={() => { void query.refetch(); }} />
        </div>
      )}

      <div aria-busy={query.isFetching}>
        {query.isLoading ? (
          <div role="status"><StatusMessage status="loading" title="Đang tải thông báo…" /></div>
        ) : !data ? (
          <div role="alert">
            <StatusMessage status="error" title="Không thể tải thông báo" message={query.error?.message}
              onRetry={() => { void query.refetch(); }} />
          </div>
        ) : data.totalCount === 0 ? (
          <StatusMessage status="empty" title="Chưa có thông báo nào"
            message="Khi nhà trường có thông tin mới cho bé, thông báo sẽ hiện ở đây." />
        ) : items.length === 0 ? (
          <StatusMessage status="empty" title="Trang này không còn thông báo"
            message="Danh sách đã thay đổi. Vui lòng quay về trang đầu."
            action={<Button variant="secondary" onClick={() => changePage(1)}>Về trang đầu</Button>} />
        ) : (
          <section aria-label="Danh sách thông báo" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-background/40 px-4 py-3 text-xs text-muted sm:px-5 sm:text-sm">
              <span>Mới nhất trước</span>
              <span className="tabular-nums">{data.totalCount} thông báo</span>
            </div>
            <div className="space-y-6 p-4 sm:p-5">
              {groupByDay(items).map((group) => (
                <section key={group.day} aria-label={`Thông báo ngày ${group.day}`}>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span aria-hidden="true" className="h-4 w-1 rounded-full bg-brand" />
                    <time>{group.day}</time>
                    <span className="text-xs font-normal text-muted">· {group.items.length} thông báo</span>
                  </h2>
                  <ol className="space-y-2.5">
                    {group.items.map((item) => {
                      // Chỉ nhận diện để tô nổi; nội dung vẫn hiển thị nguyên văn dạng văn bản thuần (D25).
                      const closure = item.message.startsWith(SCHOOL_CLOSURE_PREFIX);
                      return (
                        <li key={item.id} className={`flex min-w-0 gap-3 rounded-xl border p-3.5 sm:p-4 ${closure
                          ? "border-warning-border bg-warning-bg" : "border-border bg-card"}`}>
                          <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${closure
                            ? "bg-card text-warning" : "bg-brand-subtle text-brand"}`}>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d={BELL_ICON} />
                            </svg>
                          </span>
                          <div className="min-w-0 flex-1">
                            {closure && (
                              <span className="mb-1 inline-block rounded-full border border-warning-border bg-card px-2 py-0.5 text-xs font-medium text-amber-800">
                                Nghỉ học
                              </span>
                            )}
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">{item.message}</p>
                            <p className="mt-1.5 text-xs text-muted">
                              Nhận lúc <time dateTime={item.createdAtUtc}>{formatMeasurementDateTime(item.createdAtUtc)}</time>
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))}
            </div>
            {data.totalCount > PAGE_SIZE && (
              <Pagination page={data.page} pageSize={data.pageSize} totalCount={data.totalCount}
                onPageChange={changePage}
                className="border-t border-border px-4 py-3! sm:px-5 [&_nav]:max-w-full [&_nav]:flex-wrap" />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
