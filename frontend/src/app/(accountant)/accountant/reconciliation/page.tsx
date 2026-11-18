"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SuccessToast, type ToastMessage } from "@/components/accountant/SuccessToast";
import { ReconcileModal, type ReconcileMode } from "@/components/accountant/tuition/ReconcileModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useBankTransactions } from "@/hooks/useBankTransactions";
import { formatCurrency, formatDateTime } from "@/lib/tuition";
import { cn } from "@/lib/utils";
import {
  BANK_TRANSACTION_STATUS_LABELS,
  UNMATCHED_REASON_LABELS,
  type BankTransactionResponse,
  type BankTransactionStatus,
} from "@/types/tuition";

const PAGE_SIZE = 10;
type StatusFilter = "all" | BankTransactionStatus;
// Giữ bản giao dịch lúc mở popup: nếu tải lại bản ghi đổi trạng thái thì popup vẫn hiện được thông báo.
type Editor = { mode: ReconcileMode; transaction: BankTransactionResponse };

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "Unmatched", label: "Chưa khớp" },
  { value: "Matched", label: "Đã khớp" },
  { value: "Dismissed", label: "Đã bỏ qua" },
  { value: "all", label: "Tất cả" },
];

const STATUS_STYLES: Record<BankTransactionStatus, string> = {
  Unmatched: "border-warning-border bg-warning-bg text-amber-800",
  Matched: "border-brand-border bg-brand-subtle text-brand-text",
  Dismissed: "border-border bg-background text-muted",
};

function StatusBadge({ status }: { status: BankTransactionStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
      STATUS_STYLES[status] ?? STATUS_STYLES.Dismissed,
    )}>
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {BANK_TRANSACTION_STATUS_LABELS[status] ?? "Chưa xác định"}
    </span>
  );
}

/** Dòng giải thích dưới trạng thái: lý do chưa khớp, hóa đơn đã gán hoặc ghi chú bỏ qua. */
function Resolution({ transaction }: { transaction: BankTransactionResponse }) {
  if (transaction.status === "Unmatched") {
    return transaction.unmatchedReason
      ? <p className="mt-1.5 text-xs text-muted">{UNMATCHED_REASON_LABELS[transaction.unmatchedReason]}</p>
      : null;
  }
  if (transaction.status === "Matched") {
    const { invoiceChildFullName: child, invoicePaymentCode: code } = transaction;
    return (child || code) ? (
      <p className="mt-1.5 text-xs text-muted [overflow-wrap:anywhere]">
        {child}{child && code && " · "}{code && <span className="font-mono">{code}</span>}
      </p>
    ) : null;
  }
  return transaction.resolutionNote
    ? <p className="mt-1.5 line-clamp-2 text-xs text-muted [overflow-wrap:anywhere]" title={transaction.resolutionNote}>{transaction.resolutionNote}</p>
    : null;
}

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

export default function AccountantReconciliationPage() {
  const transactions = useBankTransactions();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Unmatched");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<ToastMessage | null>(null);
  const showNotice = (text: string) => setNotice({ id: Date.now(), text });
  const hideNotice = useCallback(() => setNotice(null), []);
  const { register, control } = useForm<{ search: string }>({ defaultValues: { search: "" } });
  const search = useWatch({ control, name: "search" }) ?? "";

  const all = useMemo(() => transactions.data ?? [], [transactions.data]);
  const counts = useMemo(() => ({
    all: all.length,
    Unmatched: all.filter((item) => item.status === "Unmatched").length,
    Matched: all.filter((item) => item.status === "Matched").length,
    Dismissed: all.filter((item) => item.status === "Dismissed").length,
  }), [all]);
  const unmatchedTotal = useMemo(
    () => all.reduce((sum, item) => item.status === "Unmatched" ? sum + item.amount : sum, 0),
    [all],
  );
  const records = useMemo(() => {
    const term = normalize(search);
    return all.filter((item) => (statusFilter === "all" || item.status === statusFilter)
      && (!term || normalize(`${item.content} ${item.transactionId}`).includes(term)));
  }, [all, search, statusFilter]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(records.length / PAGE_SIZE)));
  const start = (safePage - 1) * PAGE_SIZE;
  const hasData = transactions.data !== undefined;
  const target = editor ? all.find((item) => item.id === editor.transaction.id) ?? editor.transaction : undefined;

  const columns: Column<BankTransactionResponse>[] = [
    { key: "index", header: "STT", className: "hidden w-14 sm:table-cell", render: (_item, index) => start + index + 1 },
    {
      key: "content", header: "Giao dịch",
      render: (item) => (
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <p className="line-clamp-2 font-medium text-foreground" title={item.content}>{item.content}</p>
          <p className="mt-0.5 font-mono text-xs text-muted">{item.transactionId}</p>
          <dl className="mt-2 space-y-1 text-xs text-muted md:hidden">
            <div>
              <dt className="inline">Số tiền: </dt>
              <dd className="inline font-semibold tabular-nums text-foreground">{formatCurrency(item.amount)}</dd>
            </div>
            <div className="xl:hidden">
              <dt className="inline">Thời điểm: </dt>
              <dd className="inline tabular-nums">{formatDateTime(item.transactionAtUtc)}</dd>
            </div>
          </dl>
          <div className="mt-2 sm:hidden">
            <StatusBadge status={item.status} />
            <Resolution transaction={item} />
          </div>
        </div>
      ),
    },
    {
      key: "amount", header: "Số tiền", className: "hidden w-32 text-right md:table-cell",
      render: (item) => <span className="font-semibold tabular-nums">{formatCurrency(item.amount)}</span>,
    },
    {
      key: "transactionAtUtc", header: "Thời điểm", className: "hidden w-40 xl:table-cell",
      render: (item) => <time dateTime={item.transactionAtUtc} className="tabular-nums">{formatDateTime(item.transactionAtUtc)}</time>,
    },
    {
      key: "status", header: "Trạng thái", className: "hidden w-48 sm:table-cell",
      render: (item) => (
        <div className="min-w-0">
          <StatusBadge status={item.status} />
          <Resolution transaction={item} />
        </div>
      ),
    },
    {
      key: "actions", header: "Thao tác", className: "w-32 xl:w-48",
      render: (item) => item.status === "Unmatched" ? (
        <div className="flex flex-col gap-2 xl:flex-row">
          <Button size="sm" aria-label={`Gán giao dịch ${formatCurrency(item.amount)} vào hóa đơn`}
            onClick={() => setEditor({ mode: "match", transaction: item })}>
            Gán
          </Button>
          <Button size="sm" variant="outline" aria-label={`Bỏ qua giao dịch ${formatCurrency(item.amount)}`}
            onClick={() => setEditor({ mode: "dismiss", transaction: item })}>
            Bỏ qua
          </Button>
        </div>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
          </svg>
          Đã xử lý
        </span>
      ),
    },
  ];

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Đối soát chuyển khoản"
        description="Giao dịch vào tài khoản của trường. Gán giao dịch chưa khớp vào hóa đơn hoặc bỏ qua kèm ghi chú."
      />

      <section aria-labelledby="transaction-list-title" className="min-w-0 space-y-4">
        <div className="min-w-0">
          <h2 id="transaction-list-title" className="text-base font-semibold text-foreground">Giao dịch ngân hàng</h2>
          {hasData && !transactions.isError && (
            <p className="mt-0.5 text-xs text-muted sm:text-sm">
              {counts.Unmatched > 0 ? (
                <>
                  Còn <strong className="font-semibold text-foreground">{counts.Unmatched}</strong> giao dịch chưa khớp,
                  tổng <strong className="font-semibold tabular-nums text-foreground">{formatCurrency(unmatchedTotal)}</strong>.
                </>
              ) : "Không còn giao dịch nào chưa khớp."}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs sm:p-4 xl:flex-row xl:items-center xl:justify-between">
          <div role="group" aria-label="Lọc theo trạng thái" className="grid grid-cols-2 gap-1 rounded-xl bg-background p-1 sm:grid-cols-4 xl:inline-grid">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={statusFilter === value}
                onClick={() => { setStatusFilter(value); setPage(1); }}
                className={cn(
                  "flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                  statusFilter === value ? "bg-brand text-white shadow-xs" : "text-muted hover:bg-card hover:text-foreground",
                )}
              >
                <span className="truncate">{label}</span>
                <span className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  statusFilter === value ? "bg-white/20" : "bg-border/60",
                )}>{hasData ? counts[value] : "–"}</span>
              </button>
            ))}
          </div>
          <form role="search" className="w-full xl:w-80" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="transaction-search" className="sr-only">Tìm giao dịch theo nội dung hoặc mã giao dịch</label>
            <Input
              id="transaction-search"
              type="search"
              autoComplete="off"
              placeholder="Tìm theo nội dung hoặc mã giao dịch"
              leftIcon={(
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={1.75} d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
                </svg>
              )}
              {...register("search", { onChange: () => setPage(1) })}
            />
          </form>
        </div>

        {transactions.isError ? (
          <StatusMessage
            status="error"
            title="Không tải được danh sách giao dịch"
            message={transactions.error.message}
            onRetry={() => { void transactions.refetch(); }}
            className="bg-card"
          />
        ) : (
          <div aria-busy={transactions.isFetching} className="min-w-0 space-y-2">
            <DataTable
              columns={columns}
              data={records.slice(start, start + PAGE_SIZE)}
              keyExtractor={(item) => item.id}
              isLoading={transactions.isLoading}
              emptyMessage={all.length === 0 ? "Chưa có giao dịch ngân hàng nào" : "Không có giao dịch phù hợp với bộ lọc"}
              className="[&_table]:table-fixed"
            />
            {!transactions.isLoading && records.length > 0 && (
              <Pagination page={safePage} pageSize={PAGE_SIZE} totalCount={records.length} onPageChange={setPage} />
            )}
          </div>
        )}
      </section>

      {editor && target && (
        <ReconcileModal mode={editor.mode} transaction={target} onClose={() => setEditor(null)} onSuccess={showNotice} />
      )}

      <SuccessToast toast={notice} onClose={hideNotice} />
    </div>
  );
}
