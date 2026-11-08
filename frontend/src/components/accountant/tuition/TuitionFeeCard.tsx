"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Textarea } from "@/components/ui/Textarea";
import { useSaveTuitionFee, useTuitionFee } from "@/hooks/useTuition";
import { toApiError } from "@/lib/axios";
import {
  FEE_DESCRIPTION_MAX,
  formatAmountInput,
  formatCurrency,
  parseAmountInput,
  validateAmountInput,
} from "@/lib/tuition";
import type { TuitionFeeResponse } from "@/types/tuition";

interface FeeFormValues {
  description: string;
  amount: string;
}

function FeeForm({ fee, onDone }: { fee: TuitionFeeResponse | null; onDone: (message: string) => void }) {
  const save = useSaveTuitionFee();
  const {
    register, handleSubmit, setValue, setError, control,
    formState: { errors, isDirty },
  } = useForm<FeeFormValues>({
    defaultValues: {
      description: fee?.description ?? "",
      amount: fee ? formatAmountInput(fee.amount) : "",
    },
  });
  const description = useWatch({ control, name: "description" }) ?? "";

  const submit = async (values: FeeFormValues) => {
    if (save.isPending) return;
    try {
      await save.mutateAsync({
        id: fee?.id,
        data: { description: values.description.trim(), amount: parseAmountInput(values.amount)! },
      });
      // Lưu xong biểu phí mới làm form này bị gỡ, nên dùng mutateAsync để thông báo vẫn chạy.
      onDone(fee ? "Đã cập nhật biểu phí." : "Đã tạo biểu phí.");
    } catch (error) {
      const apiError = toApiError(error);
      setError("root.server", {
        message: apiError.errors?.length ? apiError.errors.join(" ") : apiError.message,
      });
    }
  };

  const amountField = register("amount", { validate: validateAmountInput });

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_20rem]">
        <FormField id="fee-description" label="Mô tả biểu phí" required error={errors.description?.message}>
          <Textarea
            id="fee-description"
            rows={2}
            autoFocus={!!fee}
            placeholder="Ví dụ: Học phí"
            disabled={save.isPending}
            maxLength={FEE_DESCRIPTION_MAX}
            showCount
            currentLength={description.length}
            error={errors.description?.message}
            aria-invalid={!!errors.description}
            {...register("description", {
              validate: (value) => {
                const trimmed = value.trim();
                if (!trimmed) return "Mô tả biểu phí không được để trống.";
                return trimmed.length <= FEE_DESCRIPTION_MAX
                  || `Mô tả biểu phí không được dài quá ${FEE_DESCRIPTION_MAX} ký tự.`;
              },
            })}
          />
        </FormField>
        <FormField id="fee-amount" label="Số tiền (đồng)" required error={errors.amount?.message}>
          <Input
            id="fee-amount"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ví dụ: 2.000.000"
            className="py-2.5 text-base font-semibold tabular-nums"
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
      </div>

      {fee && (
        <p className="rounded-lg bg-brand-subtle p-3 text-xs leading-relaxed text-brand-text">
          Sửa biểu phí chỉ áp dụng cho hóa đơn lập sau này; hóa đơn đã lập giữ nguyên số tiền và mô tả.
        </p>
      )}

      {errors.root?.server?.message && (
        <p role="alert" className="text-sm text-danger [overflow-wrap:anywhere]">{errors.root.server.message}</p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        {fee && (
          <Button variant="secondary" disabled={save.isPending} onClick={() => onDone("")}>Hủy</Button>
        )}
        <Button type="submit" className="min-w-28" isLoading={save.isPending} disabled={!!fee && !isDirty}>
          {fee ? "Lưu biểu phí" : "Tạo biểu phí"}
        </Button>
      </div>
    </form>
  );
}

/** FR-TUITION-01: một mức phí chung toàn trường, chỉ tạo hoặc sửa, không xóa. */
export function TuitionFeeCard({ onSuccess }: { onSuccess: (message: string) => void }) {
  const fee = useTuitionFee();
  const [isEditing, setIsEditing] = useState(false);
  const current = fee.data ?? null;
  const showForm = fee.data === null || isEditing;

  return (
    <section aria-labelledby="tuition-fee-title" className="rounded-2xl border border-brand-border bg-card p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="tuition-fee-title" className="text-base font-semibold text-foreground">Biểu phí học</h2>
        </div>
        {current && !isEditing && (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Sửa biểu phí</Button>
        )}
      </div>

      {fee.isError && fee.data !== undefined && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning-border bg-warning-bg p-3 text-sm">
          <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            {fee.error.message} <span className="text-muted">Đang hiển thị dữ liệu đã tải trước đó.</span>
          </p>
          <Button size="sm" variant="secondary" disabled={fee.isFetching} onClick={() => { void fee.refetch(); }}>Thử lại</Button>
        </div>
      )}

      {fee.isLoading ? (
        <div role="status"><StatusMessage status="loading" title="Đang tải biểu phí…" className="p-4" /></div>
      ) : fee.isError && fee.data === undefined ? (
        <div role="alert">
          <StatusMessage status="error" title="Không thể tải biểu phí" message={fee.error.message}
            onRetry={() => { void fee.refetch(); }} className="p-6" />
        </div>
      ) : showForm ? (
        <>
          {!current && (
            <p className="mb-4 rounded-lg border border-dashed border-border bg-background/50 p-3 text-sm text-muted">
              Trường chưa có biểu phí. Tạo biểu phí trước khi lập hóa đơn.
            </p>
          )}
          <FeeForm
            key={current?.id ?? "create"}
            fee={current}
            onDone={(message) => {
              setIsEditing(false);
              if (message) onSuccess(message);
            }}
          />
        </>
      ) : current && (
        <dl className="grid gap-3 rounded-xl border border-brand-border bg-brand-subtle p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-brand-text">Mô tả</dt>
            <dd className="mt-1 text-sm font-medium text-foreground [overflow-wrap:anywhere] whitespace-pre-line">{current.description}</dd>
          </div>
          <div className="sm:text-right">
            <dt className="text-xs font-medium text-brand-text">Số tiền</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums text-brand-text sm:text-2xl">{formatCurrency(current.amount)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
