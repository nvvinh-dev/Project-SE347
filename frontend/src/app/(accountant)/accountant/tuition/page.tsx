"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SuccessToast, type ToastMessage } from "@/components/accountant/SuccessToast";
import { InvoiceFormModal } from "@/components/accountant/tuition/InvoiceFormModal";
import { RecordPaymentModal } from "@/components/accountant/tuition/RecordPaymentModal";
import { TuitionFeeCard } from "@/components/accountant/tuition/TuitionFeeCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { useInvoices, useTuitionFee } from "@/hooks/useTuition";
import { formatCurrency, formatIssuedDate } from "@/lib/tuition";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_LABELS, type InvoiceResponse, type InvoiceStatus } from "@/types/tuition";

const PAGE_SIZE = 10;
type StatusFilter = "all" | InvoiceStatus;
type Editor = { kind: "create" } | { kind: "edit"; id: string } | { kind: "pay"; id: string };

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "unpaid", label: "Chưa thanh toán" },
  { value: "paid", label: "Đã thanh toán" },
];

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
      status === "paid"
        ? "border-brand-border bg-brand-subtle text-brand-text"
        : "border-warning-border bg-warning-bg text-amber-800",
    )}>
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {INVOICE_STATUS_LABELS[status] ?? "Chưa xác định"}
    </span>
  );
}

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

export default function AccountantTuitionPage() {
  const fee = useTuitionFee();
  const invoices = useInvoices();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<ToastMessage | null>(null);
  const showNotice = (text: string) => setNotice({ id: Date.now(), text });
  const hideNotice = useCallback(() => setNotice(null), []);
  const { register, control } = useForm<{ search: string }>({ defaultValues: { search: "" } });
  const search = useWatch({ control, name: "search" }) ?? "";

  const all = useMemo(() => invoices.data ?? [], [invoices.data]);
  const counts = useMemo(() => ({
    all: all.length,
    unpaid: all.filter((invoice) => invoice.status === "unpaid").length,
    paid: all.filter((invoice) => invoice.status === "paid").length,
  }), [all]);
  const unpaidTotal = useMemo(
    () => all.reduce((sum, invoice) => invoice.status === "unpaid" ? sum + invoice.amount : sum, 0),
    [all],
  );
  const records = useMemo(() => {
    const term = normalize(search);
    return all.filter((invoice) => (statusFilter === "all" || invoice.status === statusFilter)
      && (!term || normalize(`${invoice.childFullName} ${invoice.description}`).includes(term)));
  }, [all, search, statusFilter]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(records.length / PAGE_SIZE)));
  const start = (safePage - 1) * PAGE_SIZE;
  const hasCachedData = invoices.data !== undefined;
  const feeReady = !!fee.data;
  const target = editor && editor.kind !== "create" ? all.find((invoice) => invoice.id === editor.id) : undefined;


  const columns: Column<InvoiceResponse>[] = [
    { key: "index", header: "STT", className: "hidden w-14 sm:table-cell", render: (_invoice, index) => start + index + 1 },
    {
      key: "invoice", header: "Hóa đơn",
      render: (invoice) => (
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <p className="font-medium text-foreground">{invoice.childFullName}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted" title={invoice.description}>{invoice.description}</p>
          <dl className="mt-2 space-y-1 text-xs text-muted md:hidden">
            <div>
              <dt className="inline">Số tiền: </dt>
              <dd className="inline font-semibold tabular-nums text-foreground">{formatCurrency(invoice.amount)}</dd>
            </div>
            <div className="xl:hidden">
              <dt className="inline">Ngày lập: </dt>
              <dd className="inline tabular-nums">{formatIssuedDate(invoice.issuedAtUtc)}</dd>
            </div>
          </dl>
          <div className="mt-2 sm:hidden"><InvoiceStatusBadge status={invoice.status} /></div>
        </div>
      ),
    },
    {
      key: "amount", header: "Số tiền", className: "hidden w-32 text-right md:table-cell",
      render: (invoice) => <span className="font-semibold tabular-nums">{formatCurrency(invoice.amount)}</span>,
    },
    {
      key: "issuedAtUtc", header: "Ngày lập", className: "hidden w-28 xl:table-cell",
      render: (invoice) => (
        <time dateTime={invoice.issuedAtUtc} className="tabular-nums">{formatIssuedDate(invoice.issuedAtUtc)}</time>
      ),
    },
    {
      key: "status", header: "Trạng thái", className: "hidden w-36 sm:table-cell",
      render: (invoice) => <InvoiceStatusBadge status={invoice.status} />,
    },
    {
      key: "actions", header: "Thao tác", className: "w-32 xl:w-64",
      render: (invoice) => invoice.status === "unpaid" ? (
        <div className="flex flex-col gap-2 xl:flex-row">
          <Button size="sm" variant="outline" aria-label={`Sửa hóa đơn của ${invoice.childFullName}`}
            onClick={() => setEditor({ kind: "edit", id: invoice.id })}>
            Sửa
          </Button>
          <Button size="sm" aria-label={`Ghi nhận đã thu hóa đơn của ${invoice.childFullName}`}
            onClick={() => setEditor({ kind: "pay", id: invoice.id })}>
            Ghi nhận đã thu
          </Button>
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
          </svg>
          Đã khóa
        </span>
      ),
    },
  ];

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Quản lý học phí & hóa đơn"
        description="Biểu phí chung, lập hóa đơn và ghi nhận khoản phụ huynh đã nộp."
      >
        <Button disabled={!feeReady} onClick={() => setEditor({ kind: "create" })}>
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={1.75} d="M12 5v14M5 12h14" />
          </svg>
          Lập hóa đơn
        </Button>
      </PageHeader>

      <TuitionFeeCard onSuccess={showNotice} />

      <section aria-labelledby="invoice-list-title" className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 id="invoice-list-title" className="text-base font-semibold text-foreground">Hóa đơn học phí</h2>
            {hasCachedData && counts.unpaid > 0 && (
              <p className="mt-0.5 text-xs text-muted sm:text-sm">
                Còn <strong className="font-semibold text-foreground">{counts.unpaid}</strong> hóa đơn chưa thu,
                tổng <strong className="font-semibold tabular-nums text-foreground">{formatCurrency(unpaidTotal)}</strong>.
              </p>
            )}
          </div>
          {!fee.isLoading && !feeReady && (
            <p className="text-xs text-muted">Cần tạo biểu phí trước khi lập hóa đơn.</p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Lọc theo trạng thái" className="grid grid-cols-3 gap-1 rounded-xl bg-background p-1 lg:inline-grid">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={statusFilter === value}
                onClick={() => { setStatusFilter(value); setPage(1); }}
                className={cn(
                  "flex min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm",
                  statusFilter === value ? "bg-brand text-white shadow-xs" : "text-muted hover:bg-card hover:text-foreground",
                )}
              >
                <span className="truncate">{label}</span>
                {hasCachedData && (
                  <span className={cn(
                    "rounded-full px-1.5 text-[11px] tabular-nums",
                    statusFilter === value ? "bg-white/20" : "bg-border/60",
                  )}>{counts[value]}</span>
                )}
              </button>
            ))}
          </div>
          <form role="search" className="w-full lg:w-80" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="invoice-search" className="sr-only">Tìm hóa đơn theo tên trẻ hoặc mô tả</label>
            <Input
              id="invoice-search"
              type="search"
              autoComplete="off"
              placeholder="Tìm theo tên trẻ hoặc mô tả"
              leftIcon={(
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={1.75} d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
                </svg>
              )}
              {...register("search", { onChange: () => setPage(1) })}
            />
          </form>
        </div>

        {invoices.isError && hasCachedData && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-4 text-sm">
            <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              <strong className="font-medium">Không tải lại được danh sách hóa đơn.</strong>{" "}
              {invoices.error.message} <span className="text-muted">Đang hiển thị dữ liệu đã tải trước đó.</span>
            </p>
            <Button variant="secondary" size="sm" disabled={invoices.isFetching} onClick={() => { void invoices.refetch(); }}>Thử lại</Button>
          </div>
        )}

        <div aria-busy={invoices.isFetching} className="min-w-0 space-y-2">
          <DataTable
            columns={columns}
            data={records.slice(start, start + PAGE_SIZE)}
            keyExtractor={(invoice) => invoice.id}
            isLoading={invoices.isLoading}
            isError={invoices.isError && !hasCachedData}
            errorMessage={invoices.error?.message}
            onRetry={() => { void invoices.refetch(); }}
            emptyMessage={all.length === 0 ? "Chưa có hóa đơn nào" : "Không có hóa đơn phù hợp với bộ lọc"}
            className="[&_table]:table-fixed"
          />
          {!invoices.isLoading && records.length > 0 && (
            <Pagination page={safePage} pageSize={PAGE_SIZE} totalCount={records.length} onPageChange={setPage} />
          )}
        </div>
      </section>

      {editor?.kind === "create" && (
        <InvoiceFormModal fee={fee.data ?? null} onClose={() => setEditor(null)} onSuccess={showNotice} />
      )}
      {editor?.kind === "edit" && target && (
        <InvoiceFormModal invoice={target} fee={fee.data ?? null} onClose={() => setEditor(null)} onSuccess={showNotice} />
      )}
      {editor?.kind === "pay" && target && (
        <RecordPaymentModal invoice={target} onClose={() => setEditor(null)} onSuccess={showNotice} />
      )}

      <SuccessToast toast={notice} onClose={hideNotice} />
    </div>
  );
}
