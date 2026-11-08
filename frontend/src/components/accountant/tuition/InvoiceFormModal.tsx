"use client";

import { useId, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Textarea } from "@/components/ui/Textarea";
import { useChildren } from "@/hooks/useChildren";
import { useSaveInvoice } from "@/hooks/useTuition";
import {
  currentBillingPeriod,
  formatAmountInput,
  formatCurrency,
  INVOICE_DESCRIPTION_MAX,
  parseAmountInput,
  validateAmountInput,
} from "@/lib/tuition";
import type { InvoiceResponse, TuitionFeeResponse } from "@/types/tuition";
import { TuitionModal } from "./TuitionModal";

interface InvoiceFormValues {
  childId: string;
  amount: string;
  description: string;
}

interface InvoiceFormModalProps {
  /** Có hóa đơn là sửa; không có là lập mới từ biểu phí. */
  invoice?: InvoiceResponse;
  fee: TuitionFeeResponse | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

/** FR-TUITION-02: số tiền và mô tả mặc định lấy từ biểu phí, Kế toán ghi thêm kỳ thu (D39 mục 4). */
export function InvoiceFormModal({ invoice, fee, onClose, onSuccess }: InvoiceFormModalProps) {
  const formId = useId();
  const children = useChildren();
  const save = useSaveInvoice();
  const isPaid = invoice?.status === "paid";

  const {
    register, handleSubmit, setValue, setError, control,
    formState: { errors, isDirty },
  } = useForm<InvoiceFormValues>({
    defaultValues: invoice
      ? { childId: invoice.childId, amount: formatAmountInput(invoice.amount), description: invoice.description }
      : {
        childId: "",
        amount: fee ? formatAmountInput(fee.amount) : "",
        description: fee ? `${fee.description} tháng ${currentBillingPeriod()}` : "",
      },
  });
  const description = useWatch({ control, name: "description" }) ?? "";
  const amountText = useWatch({ control, name: "amount" }) ?? "";
  const previewAmount = parseAmountInput(amountText);

  const childOptions = useMemo(() => {
    const options = (children.data ?? [])
      .map((child) => ({ value: child.id, label: child.fullName }))
      .sort((a, b) => a.label.localeCompare(b.label, "vi"));
    // Trẻ của hóa đơn đang sửa vẫn hiện tên dù danh sách trẻ chưa tải được.
    if (invoice && !options.some((option) => option.value === invoice.childId)) {
      options.unshift({ value: invoice.childId, label: invoice.childFullName });
    }
    return options;
  }, [children.data, invoice]);

  const submit = (values: InvoiceFormValues) => {
    if (save.isPending || isPaid) return;
    save.mutate(
      {
        id: invoice?.id,
        data: {
          childId: values.childId,
          amount: parseAmountInput(values.amount)!,
          description: values.description.trim(),
        },
      },
      {
        onSuccess: (saved) => {
          onSuccess(invoice
            ? `Đã cập nhật hóa đơn của ${saved.childFullName}.`
            : `Đã lập hóa đơn cho ${saved.childFullName}. Phụ huynh của trẻ sẽ nhận được thông báo.`);
          onClose();
        },
        onError: (error) => setError("root.server", {
          message: error.errors?.length ? error.errors.join(" ") : error.message,
        }),
      },
    );
  };

  const amountField = register("amount", { validate: validateAmountInput });
  const needsChildren = !invoice && children.data === undefined;

  return (
    <TuitionModal
      title={invoice ? "Sửa hóa đơn" : "Lập hóa đơn"}
      description={invoice ? undefined : "Số tiền và mô tả lấy từ biểu phí. Ghi rõ kỳ thu trong mô tả."}
      isBusy={save.isPending}
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" className="min-w-20" disabled={save.isPending} onClick={onClose}>
            {isPaid ? "Đóng" : "Hủy"}
          </Button>
          {!isPaid && (
            <Button
              type="submit" form={formId} className="min-w-32" isLoading={save.isPending}
              disabled={needsChildren || (!!invoice && !isDirty)}
            >
              {invoice ? "Lưu hóa đơn" : "Lập hóa đơn"}
            </Button>
          )}
        </>
      )}
    >
      {isPaid ? (
        <p role="alert" className="rounded-xl border border-warning-border bg-warning-bg p-4 text-sm leading-relaxed">
          Hóa đơn này đã được ghi nhận thanh toán nên không sửa được nữa.
        </p>
      ) : needsChildren && children.isLoading ? (
        <div role="status"><StatusMessage status="loading" title="Đang tải danh sách trẻ…" /></div>
      ) : needsChildren && children.isError ? (
        <div role="alert">
          <StatusMessage status="error" title="Không thể tải danh sách trẻ" message={children.error.message}
            onRetry={() => { void children.refetch(); }} />
        </div>
      ) : !invoice && childOptions.length === 0 ? (
        <StatusMessage status="empty" title="Chưa có hồ sơ trẻ" message="Hãy thêm hồ sơ trẻ trước khi lập hóa đơn." />
      ) : (
        <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="space-y-5">
          <FormField id="invoice-child" label="Trẻ" required error={errors.childId?.message}>
            <Select
              id="invoice-child"
              autoFocus
              options={childOptions}
              placeholder="Chọn trẻ"
              disabled={save.isPending}
              error={errors.childId?.message}
              aria-invalid={!!errors.childId}
              {...register("childId", { required: "Hãy chọn trẻ cho hóa đơn." })}
            />
          </FormField>

          <FormField
            id="invoice-amount" label="Số tiền (đồng)" required error={errors.amount?.message}
            hint={previewAmount && previewAmount > 0 ? formatCurrency(previewAmount) : undefined}
          >
            <Input
              id="invoice-amount"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ví dụ: 2.000.000"
              className="tabular-nums"
              disabled={save.isPending}
              error={errors.amount?.message}
              aria-invalid={!!errors.amount}
              {...amountField}
              onBlur={(event) => {
                void amountField.onBlur(event);
                const amount = parseAmountInput(event.currentTarget.value);
                if (amount !== null) setValue("amount", formatAmountInput(amount), { shouldDirty: true });
              }}
            />
          </FormField>

          <FormField id="invoice-description" label="Mô tả (ghi kỳ thu)" required error={errors.description?.message}>
            <Textarea
              id="invoice-description"
              rows={3}
              placeholder="Ví dụ: Học phí tháng 11/2026"
              disabled={save.isPending}
              maxLength={INVOICE_DESCRIPTION_MAX}
              showCount
              currentLength={description.length}
              error={errors.description?.message}
              aria-invalid={!!errors.description}
              {...register("description", {
                validate: (value) => {
                  const trimmed = value.trim();
                  if (!trimmed) return "Mô tả hóa đơn không được để trống.";
                  return trimmed.length <= INVOICE_DESCRIPTION_MAX
                    || `Mô tả hóa đơn không được dài quá ${INVOICE_DESCRIPTION_MAX} ký tự.`;
                },
              })}
            />
          </FormField>

          {!invoice && (
            <p className="rounded-lg bg-brand-subtle p-3 text-xs leading-relaxed text-brand-text">
              Hóa đơn mới luôn ở trạng thái <strong className="font-semibold">Chưa thanh toán</strong>.
              Trạng thái chỉ đổi khi Kế toán ghi nhận đã thu.
            </p>
          )}

          {errors.root?.server?.message && (
            <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger [overflow-wrap:anywhere]">
              {errors.root.server.message}
            </p>
          )}
        </form>
      )}
    </TuitionModal>
  );
}
