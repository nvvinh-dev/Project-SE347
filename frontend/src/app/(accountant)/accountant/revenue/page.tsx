"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useRevenueReport } from "@/hooks/useTuition";
import { exportRevenueExcel, exportRevenuePdf, formatGeneratedAt, formatReportPeriod } from "@/lib/revenueReport";
import { formatCurrency } from "@/lib/tuition";

export default function AccountantRevenuePage() {
  const report = useRevenueReport();
  const [exportError, setExportError] = useState<string | null>(null);
  const data = report.data;

  const handlePdf = () => {
    if (!data) return;
    setExportError(exportRevenuePdf(data) ? null : "Trình duyệt đã chặn cửa sổ in. Hãy cho phép cửa sổ bật lên cho trang này rồi thử lại.");
  };

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Báo cáo doanh thu"
        description="Tổng thu học phí trong tháng hiện tại và số hóa đơn chưa thanh toán."
      >
        <Button variant="outline" disabled={report.isFetching} onClick={() => { void report.refetch(); }}>
          {report.isFetching ? "Đang cập nhật..." : "Cập nhật số liệu"}
        </Button>
        <Button variant="secondary" disabled={!data} onClick={() => data && exportRevenueExcel(data)}>Xuất Excel</Button>
        <Button disabled={!data} onClick={handlePdf}>Xuất PDF</Button>
      </PageHeader>

      {exportError && (
        <div role="alert" className="rounded-xl border border-warning-border bg-warning-bg p-4 text-sm">{exportError}</div>
      )}

      {report.isLoading && <StatusMessage status="loading" title="Đang tải báo cáo doanh thu..." />}
      {report.isError && !data && (
        <StatusMessage status="error" message={report.error.message} onRetry={() => { void report.refetch(); }} />
      )}

      {data && (
        <section aria-label="Báo cáo doanh thu" className="space-y-4">
          {report.isError && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm">
              <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                <strong className="font-medium">Không cập nhật được báo cáo.</strong> {report.error.message}{" "}
                <span className="text-muted">Đang hiển thị số liệu đã tải trước đó.</span>
              </p>
              <Button variant="secondary" size="sm" disabled={report.isFetching} onClick={() => { void report.refetch(); }}>Thử lại</Button>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-base font-semibold text-foreground">{formatReportPeriod(data)}</h2>
              <p className="text-xs text-muted">Lập lúc <time dateTime={data.generatedAtUtc}>{formatGeneratedAt(data.generatedAtUtc)}</time></p>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl border border-brand-border bg-brand-subtle p-4">
                <dt className="text-sm font-medium text-brand-text">Tổng thu trong tháng</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-foreground [overflow-wrap:anywhere] sm:text-3xl">
                  {formatCurrency(data.totalCollected)}
                </dd>
              </div>
              <div className="min-w-0 rounded-xl border border-warning-border bg-warning-bg p-4">
                <dt className="text-sm font-medium text-amber-800">Hóa đơn chưa thanh toán</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">{data.unpaidInvoiceCount}</dd>
                <p className="mt-1 text-xs text-muted">Tính tại thời điểm lập báo cáo, không giới hạn theo tháng.</p>
              </div>
            </dl>
          </div>
        </section>
      )}
    </div>
  );
}
