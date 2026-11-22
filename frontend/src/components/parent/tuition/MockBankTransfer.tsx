"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useMockBankTransfer } from "@/hooks/useMockBankTransfer";
import {
  MOCK_BANK_CONTENT_MAX, formatAmountInput, formatCurrency, formatDateTime, parseAmountInput, validateAmountInput,
} from "@/lib/tuition";
import type { MockBankReceipt } from "@/types/tuition";

interface TransferFormValues {
  amount: string;
  content: string;
}

function ReceiptView({ receipt, onAnother }: { receipt: MockBankReceipt; onAnother: () => void }) {
  const rows: [string, string][] = [
    ["Mã giao dịch", receipt.transactionId],
    ["Số tiền", formatCurrency(receipt.amount)],
    ["Nội dung", receipt.content],
    ["Thời điểm", formatDateTime(receipt.transactionAtUtc)],
  ];

  // Form bị thay bằng biên lai nên focus phải chuyển vào tiêu đề, không để rơi về body.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  return (
    <div className="space-y-5" role="status">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-text">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-foreground outline-none sm:text-lg">
            Đã gửi lệnh chuyển khoản
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Giao dịch đã được gửi tới tài khoản của nhà trường. Ngân hàng không biết hóa đơn nào được trả,
            nên hóa đơn chỉ chuyển sang <strong className="font-semibold text-foreground">Đã thanh toán</strong> sau
            khi hệ thống đối soát khớp mã và số tiền. Hãy kiểm tra lại ở màn hình hóa đơn học phí.
          </p>
        </div>
      </div>

      <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-4 py-3">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium text-foreground [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onAnother}>Chuyển khoản khác</Button>
        <Link
          href="/parent/tuition"
          className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-brand-hover active:bg-brand-active focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          Về hóa đơn học phí
        </Link>
      </div>
    </div>
  );
}

/** D57: ứng dụng ngân hàng giả của phụ huynh; số tiền và nội dung điền sẵn từ hóa đơn nhưng sửa được. */
export function MockBankTransfer() {
  const params = useSearchParams();
  const prefillAmount = Number(params.get("amount"));
  const defaultValues: TransferFormValues = {
    amount: Number.isSafeInteger(prefillAmount) && prefillAmount > 0 ? formatAmountInput(prefillAmount) : "",
    content: (params.get("content") ?? "").slice(0, MOCK_BANK_CONTENT_MAX),
  };

  const transfer = useMockBankTransfer();
  const { register, handleSubmit, reset, setFocus, control, formState: { errors } } = useForm<TransferFormValues>({ defaultValues });
  const content = useWatch({ control, name: "content" });
  const contentLength = content?.length ?? 0;

  const submit = (values: TransferFormValues) => {
    const amount = parseAmountInput(values.amount);
    if (amount === null || transfer.isPending) return;
    transfer.mutate({ amount, content: values.content.trim() });
  };

  if (transfer.isSuccess) {
    return (
      <ReceiptView
        receipt={transfer.data}
        onAnother={() => {
          transfer.reset();
          reset(defaultValues);
          // Biên lai biến mất cùng nút vừa bấm; đưa focus vào ô đầu của form mới hiện lại.
          requestAnimationFrame(() => setFocus("amount"));
        }}
      />
    );
  }

  const serverError = transfer.error
    ? (transfer.error.status === 404
      ? "Ngân hàng giả lập hiện không khả dụng."
      : transfer.error.errors?.length ? transfer.error.errors.join(" ") : transfer.error.message)
    : null;

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-foreground">Tài khoản nhận</p>
        <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3.5 py-2.5 text-sm">
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-text">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18M12 3 3 8h18l-9-5Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-medium text-foreground">Tài khoản của nhà trường</p>
            <p className="text-xs text-muted">Cố định, không thay đổi được</p>
          </div>
        </div>
      </div>

      <FormField id="mock-bank-amount" label="Số tiền (đ)" required error={errors.amount?.message}>
        <Input
          id="mock-bank-amount"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ví dụ: 1.500.000"
          disabled={transfer.isPending}
          error={errors.amount?.message}
          aria-invalid={!!errors.amount}
          {...register("amount", { validate: validateAmountInput })}
        />
      </FormField>

      <FormField
        id="mock-bank-content" label="Nội dung chuyển khoản" required
        hint={`${contentLength}/${MOCK_BANK_CONTENT_MAX}`} error={errors.content?.message}
      >
        <Input
          id="mock-bank-content"
          autoComplete="off"
          placeholder="Mã thanh toán của hóa đơn"
          maxLength={MOCK_BANK_CONTENT_MAX}
          disabled={transfer.isPending}
          error={errors.content?.message}
          aria-invalid={!!errors.content}
          {...register("content", {
            validate: (value) => value.trim().length > 0 || "Nội dung chuyển khoản không được để trống.",
          })}
        />
      </FormField>

      {serverError && (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg p-3 text-sm text-danger [overflow-wrap:anywhere]">
          {serverError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/parent/tuition"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          Quay lại hóa đơn
        </Link>
        <Button type="submit" className="min-w-36" isLoading={transfer.isPending}>
          Chuyển khoản
        </Button>
      </div>
    </form>
  );
}
