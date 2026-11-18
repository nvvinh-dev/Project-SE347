"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Textarea } from "@/components/ui/Textarea";
import { useDismissBankTransaction, useMatchBankTransaction } from "@/hooks/useBankTransactions";
import { useInvoices } from "@/hooks/useTuition";
import { formatCurrency, formatDateTime, formatIssuedDate, RESOLUTION_NOTE_MAX } from "@/lib/tuition";
import { cn } from "@/lib/utils";
import { UNMATCHED_REASON_LABELS, type BankTransactionResponse, type InvoiceResponse } from "@/types/tuition";
import { TuitionModal } from "./TuitionModal";

export type ReconcileMode = "match" | "dismiss";

interface ReconcileModalProps {
  mode: ReconcileMode;
  transaction: BankTransactionResponse;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface ReconcileFormValues {
  invoiceId: string;
  note: string;
}

// Ngân hàng bỏ dấu và ký tự đặc biệt trong nội dung, nên so mã theo cách server chuẩn hóa (D21 mục 2).
const compact = (value: string) => value.toUpperCase().replace(/[\s.\-_]/g, "");

function TransactionSummary({ transaction }: { transaction: BankTransactionResponse }) {
  return (
    <dl className="grid gap-x-4 gap-y-3 rounded-xl border border-brand-border bg-brand-subtle p-4 text-sm sm:grid-cols-2">
      <div className="sm:col-span-2">
        <dt className="text-xs font-medium text-brand-text">Số tiền vào tài khoản</dt>
        <dd className="mt-0.5 text-xl font-semibold tabular-nums text-brand-text">{formatCurrency(transaction.amount)}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-brand-text">Thời điểm</dt>
        <dd className="mt-0.5 tabular-nums text-foreground">{formatDateTime(transaction.transactionAtUtc)}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-brand-text">Mã giao dịch</dt>
        <dd className="mt-0.5 font-mono text-xs text-foreground [overflow-wrap:anywhere]">{transaction.transactionId}</dd>
      </div>
      <div className="min-w-0 sm:col-span-2">
        <dt className="text-xs font-medium text-brand-text">Nội dung chuyển khoản</dt>
        <dd className="mt-0.5 text-foreground [overflow-wrap:anywhere]">{transaction.content}</dd>
      </div>
      {transaction.unmatchedReason && (
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs font-medium text-brand-text">Lý do chưa khớp</dt>
          <dd className="mt-0.5 text-foreground">{UNMATCHED_REASON_LABELS[transaction.unmatchedReason]}</dd>
        </div>
      )}
    </dl>
  );
}

function InvoiceOption({ invoice, checked, suggested, disabled, register }: {
  invoice: InvoiceResponse;
  checked: boolean;
  suggested: boolean;
  disabled: boolean;
  register: UseFormRegister<ReconcileFormValues>;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30",
        checked ? "border-brand bg-brand-subtle" : "border-border hover:border-border-hover hover:bg-background/50",
      )}
    >
      <input
        type="radio"
        value={invoice.id}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
        {...register("invoiceId", { required: "Hãy chọn hóa đơn cần gán." })}
      />
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-foreground">{invoice.childFullName}</span>
          {suggested && (
            <span className="rounded-full border border-brand-border bg-brand-subtle px-2 py-0.5 text-[11px] font-medium text-brand-text">
              Mã có trong nội dung
            </span>
          )}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted" title={invoice.description}>{invoice.description}</span>
        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
          {invoice.paymentCode && <span>Mã: <span className="font-mono text-foreground">{invoice.paymentCode}</span></span>}
          <span>Ngày lập: <span className="tabular-nums">{formatIssuedDate(invoice.issuedAtUtc)}</span></span>
        </span>
      </span>
    </label>
  );
}

/**
 * FR-TUITION-09: gán giao dịch chưa khớp vào hóa đơn cùng số tiền, hoặc đánh dấu đã xử lý ngoài hệ thống
 * kèm ghi chú. Cả hai không hoàn tác được (BR-TUITION-16) nên luôn có bước xác nhận lại.
 */
export function ReconcileModal({ mode, transaction, onClose, onSuccess }: ReconcileModalProps) {
  const formId = useId();
  const match = useMatchBankTransaction();
  const dismiss = useDismissBankTransaction();
  const invoices = useInvoices();
  const isMatch = mode === "match";
  const isPending = match.isPending || dismiss.isPending;
  const [confirming, setConfirming] = useState<ReconcileFormValues | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const refocusRef = useRef(false);
  // Giao dịch vừa được người khác xử lý (409 làm tải lại danh sách): khóa form.
  const isResolved = transaction.status !== "Unmatched" && !isPending;

  const { register, handleSubmit, control, formState: { errors } } = useForm<ReconcileFormValues>({
    defaultValues: { invoiceId: "", note: "" },
  });
  const [invoiceId, note] = useWatch({ control, name: ["invoiceId", "note"] });

  // Gán chỉ chấp nhận hóa đơn chưa thanh toán đúng số tiền giao dịch (409 nếu khác).
  const candidates = useMemo(() => {
    const content = compact(transaction.content);
    return (invoices.data ?? [])
      .filter((invoice) => invoice.status === "unpaid" && invoice.amount === transaction.amount)
      .map((invoice) => ({ invoice, suggested: !!invoice.paymentCode && content.includes(invoice.paymentCode) }))
      .sort((a, b) => Number(b.suggested) - Number(a.suggested));
  }, [invoices.data, transaction.amount, transaction.content]);
  const selected = candidates.find(({ invoice }) => invoice.id === invoiceId)?.invoice;

  const backToForm = () => {
    refocusRef.current = true;
    setConfirming(null);
  };

  useEffect(() => {
    if (confirming || isPending || !refocusRef.current) return;
    refocusRef.current = false;
    (continueRef.current ?? cancelRef.current)?.focus();
  }, [confirming, isPending]);

  const review = (values: ReconcileFormValues) => {
    if (isResolved) return;
    setServerError(null);
    setConfirming({ invoiceId: values.invoiceId, note: values.note.trim() });
  };

  const fail = (error: { message: string; errors: string[] | null }) => {
    backToForm();
    setServerError(error.errors?.length ? error.errors.join(" ") : error.message);
  };

  const confirm = () => {
    if (!confirming || isPending) return;
    if (isMatch) {
      match.mutate({ id: transaction.id, invoiceId: confirming.invoiceId }, {
        onSuccess: () => {
          onSuccess(`Đã gán giao dịch ${formatCurrency(transaction.amount)} vào hóa đơn của ${selected?.childFullName ?? "trẻ"}.`);
          onClose();
        },
        onError: fail,
      });
    } else {
      dismiss.mutate({ id: transaction.id, data: { note: confirming.note } }, {
        onSuccess: () => {
          onSuccess(`Đã đánh dấu giao dịch ${formatCurrency(transaction.amount)} là đã xử lý ngoài hệ thống.`);
          onClose();
        },
        onError: fail,
      });
    }
  };

  const rows: [string, string][] = [
    ["Giao dịch", `${formatCurrency(transaction.amount)} · ${formatDateTime(transaction.transactionAtUtc)}`],
    ["Nội dung", transaction.content],
    ...(isMatch && selected
      ? [["Trẻ", selected.childFullName], ["Hóa đơn", selected.description]] as [string, string][]
      : [["Ghi chú", confirming?.note ?? ""]] as [string, string][]),
  ];

  return (
    <TuitionModal
      title={isMatch ? "Gán vào hóa đơn" : "Bỏ qua giao dịch"}
      description={isMatch
        ? "Chọn hóa đơn chưa thanh toán có đúng số tiền của giao dịch này."
        : "Đánh dấu giao dịch đã được xử lý ngoài hệ thống, ví dụ hoàn tiền chuyển thừa hoặc chuyển nhầm."}
      isBusy={isPending}
      nestedOpen={!!confirming}
      onNestedEscape={() => { if (!isPending) backToForm(); }}
      onClose={onClose}
      footer={(
        <>
          <Button ref={cancelRef} variant="secondary" className="min-w-20" disabled={isPending} onClick={onClose}>
            {isResolved ? "Đóng" : "Hủy"}
          </Button>
          {!isResolved && (
            <Button ref={continueRef} type="submit" form={formId} className="min-w-32"
              disabled={isPending || (isMatch && candidates.length === 0)}>
              Tiếp tục
            </Button>
          )}
        </>
      )}
      overlay={(
        <ConfirmDialog
          isOpen={!!confirming}
          title={isMatch ? "Xác nhận gán giao dịch?" : "Xác nhận bỏ qua giao dịch?"}
          layout="stacked"
          confirmText={isMatch ? "Xác nhận gán" : "Xác nhận bỏ qua"}
          cancelText="Quay lại"
          isLoading={isPending}
          onConfirm={confirm}
          onClose={backToForm}
          description={confirming && (
            <div className="space-y-4">
              {/* ConfirmDialog không tự cuộn: giới hạn phần tóm tắt để nút xác nhận luôn nằm trong màn hình nhỏ. */}
              <dl className="max-h-[calc(100dvh-22rem)] divide-y divide-border overflow-y-auto overscroll-contain rounded-xl border border-border text-sm">
                {rows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 px-3 py-2.5">
                    <dt className="text-muted">{label}</dt>
                    <dd className="whitespace-pre-line font-medium text-foreground [overflow-wrap:anywhere]">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="rounded-lg border border-warning-border bg-warning-bg p-3 text-xs leading-relaxed text-amber-800">
                <strong className="font-semibold">Không thể hoàn tác sau khi xác nhận.</strong>{" "}
                {isMatch
                  ? "Hóa đơn sẽ chuyển sang Đã thanh toán và bị khóa."
                  : "Giao dịch sẽ không được xử lý lại và hệ thống không hoàn tiền."}
              </p>
            </div>
          )}
        />
      )}
    >
      <div className="space-y-5">
        <TransactionSummary transaction={transaction} />

        {isResolved ? (
          <p role="alert" className="rounded-xl border border-warning-border bg-warning-bg p-4 text-sm leading-relaxed">
            Giao dịch này đã được xử lý, không xử lý lại được.
          </p>
        ) : (
          <form id={formId} noValidate onSubmit={handleSubmit(review)} className="space-y-4">
            {isMatch ? (
              <fieldset className="space-y-3" disabled={isPending}>
                <legend className="mb-1 text-xs font-semibold text-foreground">
                  Hóa đơn chưa thanh toán · {formatCurrency(transaction.amount)}<span className="ml-1 text-danger">*</span>
                </legend>
                {invoices.isLoading && <StatusMessage status="loading" title="Đang tải hóa đơn..." />}
                {invoices.isError && !invoices.data && (
                  <StatusMessage status="error" message={invoices.error.message} onRetry={() => { void invoices.refetch(); }} />
                )}
                {invoices.data && candidates.length === 0 && (
                  <p className="rounded-xl border border-border bg-background/60 p-4 text-sm leading-relaxed text-muted">
                    Không có hóa đơn chưa thanh toán nào có đúng số tiền này. Nếu tiền không phải học phí hoặc đã hoàn lại,
                    hãy chọn <strong className="font-medium text-foreground">Bỏ qua</strong> kèm ghi chú.
                  </p>
                )}
                {candidates.length > 0 && (
                  <div className="max-h-72 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
                    {candidates.map(({ invoice, suggested }) => (
                      <InvoiceOption key={invoice.id} invoice={invoice} suggested={suggested}
                        checked={invoiceId === invoice.id} disabled={isPending} register={register} />
                    ))}
                  </div>
                )}
                {errors.invoiceId?.message && <p role="alert" className="text-xs text-danger">{errors.invoiceId.message}</p>}
              </fieldset>
            ) : (
              <FormField id="resolution-note" label="Ghi chú xử lý" required error={errors.note?.message}>
                <Textarea
                  id="resolution-note"
                  rows={4}
                  autoFocus
                  placeholder="Ví dụ: Đã hoàn lại 500.000 đ chuyển thừa cho phụ huynh"
                  maxLength={RESOLUTION_NOTE_MAX}
                  showCount
                  currentLength={note?.length ?? 0}
                  disabled={isPending}
                  error={errors.note?.message}
                  aria-invalid={!!errors.note}
                  {...register("note", {
                    validate: (value) => {
                      const trimmed = value.trim();
                      if (!trimmed) return "Hãy nhập ghi chú xử lý.";
                      return trimmed.length <= RESOLUTION_NOTE_MAX
                        || `Ghi chú không được dài quá ${RESOLUTION_NOTE_MAX} ký tự.`;
                    },
                  })}
                />
              </FormField>
            )}

            {serverError && (
              <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger [overflow-wrap:anywhere]">
                {serverError}
              </p>
            )}
          </form>
        )}
      </div>
    </TuitionModal>
  );
}
