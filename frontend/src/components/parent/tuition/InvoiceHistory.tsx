"use client";

import { useState } from "react";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import type { useParentInvoices } from "@/hooks/useParentInvoices";
import { formatCurrency, formatIssuedDate } from "@/lib/tuition";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, type ChildInvoiceResponse, type InvoiceStatus } from "@/types/tuition";

const PAGE_SIZE = 10;
const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  unpaid: "border-warning-border bg-warning-bg text-amber-800",
  paid: "border-brand-border bg-brand-subtle text-brand-text",
};

function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm",
      STATUS_CLASSES[status] ?? "border-border bg-background text-muted",
    )}>
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {INVOICE_STATUS_LABELS[status] ?? "Chưa xác định"}
    </span>
  );
}

function SummaryTile({ label, value, hint, accent }: { label: string; value: string; hint: string; accent: boolean }) {
  return (
    <div className={cn(
      "min-w-0 rounded-xl border px-4 py-3 sm:px-5 sm:py-4",
      accent ? "border-warning-border bg-warning-bg" : "border-brand-border bg-brand-subtle",
    )}>
      <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground [overflow-wrap:anywhere] sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

export function InvoiceHistory({ invoices }: { invoices: ReturnType<typeof useParentInvoices> }) {
  const [page, setPage] = useState(1);
  const records = invoices.data ?? [];
  // Lỗi tạm thời giữ dữ liệu cũ; lỗi ngoài phạm vi phải ẩn toàn bộ dữ liệu đã lưu.
  const hasVisibleData = invoices.data !== undefined
    && invoices.error?.status !== 403 && invoices.error?.status !== 404;
  const showError = invoices.isError && !hasVisibleData;
  const safePage = Math.min(page, Math.max(1, Math.ceil(records.length / PAGE_SIZE)));
  const start = (safePage - 1) * PAGE_SIZE;

  const unpaid = records.filter((invoice) => invoice.status === "unpaid");
  const unpaidTotal = unpaid.reduce((sum, invoice) => sum + invoice.amount, 0);

  const columns: Column<ChildInvoiceResponse>[] = [
    {
      key: "description",
      header: "Nội dung hóa đơn",
      className: "min-w-0",
      render: (invoice) => (
        <div className="space-y-1">
          <p className="font-medium text-foreground [overflow-wrap:anywhere]">{invoice.description}</p>
          {/* Điện thoại gộp ngày lập và số tiền xuống dưới nội dung để bảng không bị chật. */}
          <p className="text-xs text-muted sm:hidden">
            <time dateTime={invoice.issuedAtUtc}>{formatIssuedDate(invoice.issuedAtUtc)}</time>
            {" · "}
            <span className="font-medium tabular-nums text-foreground">{formatCurrency(invoice.amount)}</span>
          </p>
        </div>
      ),
    },
    {
      key: "issuedAtUtc",
      header: "Ngày lập",
      className: "hidden whitespace-nowrap text-center sm:table-cell sm:w-36",
      render: (invoice) => (
        <time dateTime={invoice.issuedAtUtc} className="tabular-nums">{formatIssuedDate(invoice.issuedAtUtc)}</time>
      ),
    },
    {
      key: "amount",
      header: "Số tiền",
      className: "hidden whitespace-nowrap text-right sm:table-cell sm:w-40",
      render: (invoice) => <span className="font-semibold tabular-nums">{formatCurrency(invoice.amount)}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-36 text-center sm:w-48",
      render: (invoice) => <InvoiceBadge status={invoice.status} />,
    },
  ];

  return (
    <>
      {invoices.isError && hasVisibleData && (
        <RefreshErrorNotice className="border-b border-warning-border px-4 py-3 sm:px-6" message={invoices.error.message}
          isFetching={invoices.isFetching} onRetry={() => { void invoices.refetch(); }} />
      )}
      {hasVisibleData && records.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-b border-border p-4 sm:gap-4 sm:p-6">
          <SummaryTile
            label="Cần thanh toán"
            value={formatCurrency(unpaidTotal)}
            hint={unpaid.length > 0 ? `${unpaid.length} hóa đơn chưa thanh toán` : "Không có hóa đơn nào chưa thanh toán"}
            accent={unpaid.length > 0}
          />
          <SummaryTile
            label="Đã thanh toán"
            value={`${records.length - unpaid.length} hóa đơn`}
            hint={`Tổng ${records.length} hóa đơn`}
            accent={false}
          />
        </div>
      )}
      <div aria-busy={invoices.isFetching}>
        <div role={invoices.isLoading ? "status" : showError ? "alert" : undefined}>
          <DataTable
            columns={columns}
            data={records.slice(start, start + PAGE_SIZE)}
            keyExtractor={(invoice) => invoice.id}
            isLoading={invoices.isLoading}
            isError={showError}
            errorMessage={invoices.error?.message}
            onRetry={() => { void invoices.refetch(); }}
            emptyMessage="Chưa có hóa đơn học phí nào cho bé."
            className="rounded-none! border-0! shadow-none! [&_td]:px-3 [&_td]:py-4 [&_th]:px-3 [&_thead]:bg-brand-subtle/50 sm:[&_td]:px-6 sm:[&_th]:px-6"
          />
        </div>
      </div>
      {hasVisibleData && records.length > PAGE_SIZE && (
        <Pagination
          page={safePage}
          pageSize={PAGE_SIZE}
          totalCount={records.length}
          onPageChange={setPage}
          showSummary={false}
          className="justify-end! border-t border-border px-4 py-4! [&_nav]:max-w-full [&_nav]:flex-wrap sm:px-6"
        />
      )}
    </>
  );
}
