"use client";

import { useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useRecordPayment } from "@/hooks/useTuition";
import { EXTERNAL_REFERENCE_MAX, formatCurrency, formatIssuedDate } from "@/lib/tuition";
import { cn } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type InvoiceResponse, type PaymentMethod } from "@/types/tuition";
import { TuitionModal } from "./TuitionModal";

interface PaymentFormValues {
  paymentMethod: PaymentMethod | "";
  externalReference: string;
}

interface RecordPaymentModalProps {
  invoice: InvoiceResponse;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const METHOD_HINTS: Record<PaymentMethod, string> = {
  Cash: "Phụ huynh nộp trực tiếp tại trường",
  BankTransfer: "Cần mã giao dịch ngân hàng",
};

function InvoiceSummary({ invoice }: { invoice: InvoiceResponse }) {
  return (
    <dl className="grid gap-x-4 gap-y-3 rounded-xl border border-brand-border bg-brand-subtle p-4 text-sm sm:grid-cols-2">
      <div className="min-w-0">
        <dt className="text-xs font-medium text-brand-text">Trẻ</dt>
        <dd className="mt-0.5 font-medium text-foreground [overflow-wrap:anywhere]">{invoice.childFullName}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-brand-text">Ngày lập</dt>
        <dd className="mt-0.5 tabular-nums text-foreground">{formatIssuedDate(invoice.issuedAtUtc)}</dd>
      </div>
      <div className="min-w-0 sm:col-span-2">
        <dt className="text-xs font-medium text-brand-text">Hóa đơn</dt>
        <dd className="mt-0.5 text-foreground [overflow-wrap:anywhere] whitespace-pre-line">{invoice.description}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs font-medium text-brand-text">Số tiền phải thu</dt>
        <dd className="mt-0.5 text-xl font-semibold tabular-nums text-brand-text">{formatCurrency(invoice.amount)}</dd>
      </div>
    </dl>
  );
}

/**
 * FR-TUITION-06: chọn hình thức, nhập mã giao dịch khi chuyển khoản, xem lại rồi xác nhận.
 * Ghi nhận không hủy được (D21) nên luôn có bước xác nhận lại.
 */
export function RecordPaymentModal({ invoice, onClose, onSuccess }: RecordPaymentModalProps) {
  const formId = useId();
  const record = useRecordPayment();
  const [confirming, setConfirming] = useState<{ method: PaymentMethod; reference: string | null } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // Danh sách đổi sang paid ngay khi ghi nhận xong; chỉ khóa form khi hóa đơn đã paid từ trước.
  const isPaid = invoice.status === "paid" && !record.isPending && !record.isSuccess;

  const { register, handleSubmit, control, formState: { errors } } = useForm<PaymentFormValues>({
    defaultValues: { paymentMethod: "", externalReference: "" },
    shouldUnregister: true,
  });
  const method = useWatch({ control, name: "paymentMethod" });

  const review = (values: PaymentFormValues) => {
    if (!values.paymentMethod || isPaid) return;
    setServerError(null);
    setConfirming({
      method: values.paymentMethod,
      reference: values.paymentMethod === "BankTransfer" ? values.externalReference.trim() : null,
    });
  };

  const confirm = () => {
    if (!confirming || record.isPending) return;
    record.mutate(
      { invoiceId: invoice.id, data: { paymentMethod: confirming.method, externalReference: confirming.reference } },
      {
        onSuccess: () => {
          onSuccess(`Đã ghi nhận thu ${formatCurrency(invoice.amount)} (${PAYMENT_METHOD_LABELS[confirming.method].toLowerCase()}) cho hóa đơn của ${invoice.childFullName}.`);
          onClose();
        },
        onError: (error) => {
          setConfirming(null);
          setServerError(error.errors?.length ? error.errors.join(" ") : error.message);
        },
      },
    );
  };

  return (
    <TuitionModal
      title="Ghi nhận đã thu"
      description="Ghi nhận khoản học phí phụ huynh đã nộp cho nhà trường."
      isBusy={record.isPending}
      nestedOpen={!!confirming}
      onNestedEscape={() => { if (!record.isPending) setConfirming(null); }}
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" className="min-w-20" disabled={record.isPending} onClick={onClose}>
            {isPaid ? "Đóng" : "Hủy"}
          </Button>
          {!isPaid && (
            <Button type="submit" form={formId} className="min-w-32" disabled={record.isPending}>Tiếp tục</Button>
          )}
        </>
      )}
      overlay={(
        <ConfirmDialog
          isOpen={!!confirming}
          title="Xác nhận ghi nhận đã thu?"
          layout="stacked"
          confirmText="Xác nhận đã thu"
          cancelText="Quay lại"
          isLoading={record.isPending}
          onConfirm={confirm}
          onClose={() => setConfirming(null)}
          description={confirming && (
            <div className="space-y-4">
              {/* ConfirmDialog không tự cuộn: giới hạn phần tóm tắt để nút xác nhận luôn nằm trong màn hình nhỏ. */}
              <dl className="max-h-[calc(100dvh-22rem)] divide-y divide-border overflow-y-auto overscroll-contain rounded-xl border border-border text-sm">
                {[
                  ["Trẻ", invoice.childFullName],
                  ["Hóa đơn", invoice.description],
                  ["Số tiền", formatCurrency(invoice.amount)],
                  ["Hình thức", PAYMENT_METHOD_LABELS[confirming.method]],
                  ...(confirming.reference ? [["Mã giao dịch", confirming.reference]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-3 py-2.5">
                    <dt className="text-muted">{label}</dt>
                    <dd className={cn(
                      "font-medium text-foreground [overflow-wrap:anywhere]",
                      label === "Số tiền" && "tabular-nums text-brand-text",
                    )}>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="rounded-lg border border-warning-border bg-warning-bg p-3 text-xs leading-relaxed text-amber-800">
                <strong className="font-semibold">Không thể hủy hoặc sửa sau khi ghi nhận.</strong>{" "}
                Hóa đơn sẽ chuyển sang Đã thanh toán và bị khóa. Hãy kiểm tra kỹ trước khi xác nhận.
              </p>
            </div>
          )}
        />
      )}
    >
      <div className="space-y-5">
        <InvoiceSummary invoice={invoice} />

        {isPaid ? (
          <p role="alert" className="rounded-xl border border-warning-border bg-warning-bg p-4 text-sm leading-relaxed">
            Hóa đơn này đã được ghi nhận thanh toán, không ghi nhận lại được.
          </p>
        ) : (
          <form id={formId} noValidate onSubmit={handleSubmit(review)} className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-foreground">
                Hình thức thanh toán<span className="ml-1 text-danger">*</span>
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30",
                      method === value
                        ? "border-brand bg-brand-subtle"
                        : "border-border hover:border-border-hover hover:bg-background/50",
                    )}
                  >
                    <input
                      type="radio"
                      value={value}
                      disabled={record.isPending}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                      aria-describedby={`${formId}-${value}-hint`}
                      {...register("paymentMethod", { required: "Hãy chọn hình thức thanh toán." })}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{PAYMENT_METHOD_LABELS[value]}</span>
                      <span id={`${formId}-${value}-hint`} className="mt-0.5 block text-xs text-muted">{METHOD_HINTS[value]}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.paymentMethod?.message && (
                <p role="alert" className="mt-1.5 text-xs text-danger">{errors.paymentMethod.message}</p>
              )}
            </fieldset>

            {method === "BankTransfer" && (
              <FormField id="payment-reference" label="Mã giao dịch" required error={errors.externalReference?.message}>
                <Input
                  id="payment-reference"
                  autoFocus
                  autoComplete="off"
                  placeholder="Mã giao dịch trên sao kê ngân hàng"
                  maxLength={EXTERNAL_REFERENCE_MAX}
                  disabled={record.isPending}
                  error={errors.externalReference?.message}
                  aria-invalid={!!errors.externalReference}
                  {...register("externalReference", {
                    validate: (value) => {
                      const trimmed = value.trim();
                      if (!trimmed) return "Chuyển khoản phải có mã giao dịch.";
                      return trimmed.length <= EXTERNAL_REFERENCE_MAX
                        || `Mã giao dịch không được dài quá ${EXTERNAL_REFERENCE_MAX} ký tự.`;
                    },
                  })}
                />
              </FormField>
            )}

            <p className="text-xs leading-relaxed text-muted">
              Số tiền ghi nhận luôn bằng số tiền hóa đơn, không thu một phần.
            </p>

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
