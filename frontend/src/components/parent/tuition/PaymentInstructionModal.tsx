"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TuitionModal } from "@/components/accountant/tuition/TuitionModal";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useParentPaymentInstruction } from "@/hooks/useParentPaymentInstruction";
import { formatCurrency, MOCK_BANK_ENABLED } from "@/lib/tuition";
import { cn } from "@/lib/utils";
import type { ChildInvoiceResponse, PaymentInstructionResponse } from "@/types/tuition";
import { MockBankNotice } from "./MockBankNotice";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      // Trang http ngoài localhost hoặc trình duyệt chặn clipboard: người dùng vẫn tự chọn chép được.
      setState("failed");
    }
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setState("idle"), 2000);
  };

  return (
    <button
      type="button"
      onClick={() => { void copy(); }}
      aria-label={`Sao chép ${label}`}
      className="shrink-0 cursor-pointer rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-brand-text transition-colors hover:bg-brand-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
    >
      <span aria-live="polite">
        {state === "copied" ? "Đã chép" : state === "failed" ? "Không chép được" : "Sao chép"}
      </span>
    </button>
  );
}

function DetailRow({ label, value, copyValue, emphasis, mono }: {
  label: string; value: string; copyValue?: string; emphasis?: boolean; mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className={cn(
          "mt-0.5 font-medium text-foreground [overflow-wrap:anywhere]",
          mono && "font-mono tracking-wide",
          emphasis && "text-base font-semibold text-brand-text sm:text-lg",
        )}>
          {value}
        </dd>
      </div>
      {copyValue !== undefined && <CopyButton value={copyValue} label={label.toLowerCase()} />}
    </div>
  );
}

function QrImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // D21: ảnh QR không tải được thì vẫn đủ thông tin dạng chữ bên dưới.
    return (
      <p role="status" className="rounded-xl border border-warning-border bg-warning-bg px-4 py-3 text-center text-sm text-amber-800">
        Không tải được ảnh mã QR. Bạn vẫn có thể chuyển khoản theo thông tin bên dưới.
      </p>
    );
  }

  return (
    <figure className="mx-auto flex w-fit max-w-full flex-col items-center gap-2">
      <div className="rounded-xl border border-border bg-white p-2.5 shadow-xs">
        {/* unoptimized: giữ nguyên ảnh VietQR để mã quét được; trình duyệt tải thẳng từ img.vietqr.io. */}
        <Image
          src={url}
          alt="Mã QR chuyển khoản học phí"
          width={216}
          height={216}
          unoptimized
          onError={() => setFailed(true)}
          className="h-auto w-48 max-w-full sm:w-56"
        />
      </div>
      <figcaption className="text-xs text-muted">Mã QR theo chuẩn VietQR của tài khoản giả lập</figcaption>
    </figure>
  );
}

function InstructionBody({ instruction }: { instruction: PaymentInstructionResponse }) {
  return (
    <div className="space-y-5">
      {/* Luôn hiện, không phụ thuộc cờ: số tài khoản trong đồ án là tài khoản giả (D21 mục 1). */}
      <MockBankNotice />
      <QrImage url={instruction.qrImageUrl} />
      <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        <DetailRow label="Ngân hàng" value={instruction.bankName} />
        <DetailRow label="Chủ tài khoản" value={instruction.accountName} />
        <DetailRow label="Số tài khoản" value={instruction.accountNumber} copyValue={instruction.accountNumber} mono />
        <DetailRow label="Số tiền" value={formatCurrency(instruction.amount)} copyValue={String(instruction.amount)} emphasis />
        <DetailRow label="Nội dung chuyển khoản" value={instruction.transferContent} copyValue={instruction.transferContent} mono emphasis />
      </dl>
      <p className="rounded-xl border border-brand-border bg-brand-subtle px-4 py-3 text-sm leading-relaxed text-brand-text">
        Vui lòng nhập <strong className="font-semibold">đúng số tiền</strong> và{" "}
        <strong className="font-semibold">đúng nội dung chuyển khoản</strong> (không thêm chữ khác) để hệ thống tự đối soát.
        Hóa đơn chuyển sang <strong className="font-semibold">Đã thanh toán</strong> sau khi nhà trường nhận được tiền;
        bạn không cần xác nhận thêm trên hệ thống.
      </p>
    </div>
  );
}

interface PaymentInstructionModalProps {
  childId: string;
  invoice: ChildInvoiceResponse;
  onClose: () => void;
}

/** FR-TUITION-07: thông tin chuyển khoản của hóa đơn chưa thanh toán; không có nút "đã thanh toán" (D21). */
export function PaymentInstructionModal({ childId, invoice, onClose }: PaymentInstructionModalProps) {
  const query = useParentPaymentInstruction(childId, invoice.id);
  const instruction = query.data;
  const mockHref = instruction
    ? `/parent/mock-bank?${new URLSearchParams({
      amount: String(instruction.amount), content: instruction.transferContent,
    }).toString()}`
    : null;

  return (
    <TuitionModal
      title="Thông tin chuyển khoản"
      description={invoice.description}
      isBusy={false}
      onClose={onClose}
      footer={(
        <>
          <Button variant="secondary" className="min-w-20" onClick={onClose}>Đóng</Button>
          {MOCK_BANK_ENABLED && mockHref && (
            <Link
              href={mockHref}
              className="inline-flex min-w-32 items-center justify-center gap-2 rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              Mở Ngân hàng giả lập
            </Link>
          )}
        </>
      )}
    >
      <div aria-busy={query.isFetching}>
        {query.isLoading ? (
          <div role="status"><StatusMessage status="loading" title="Đang tải thông tin chuyển khoản…" /></div>
        ) : query.isError ? (
          <div role="alert">
            {query.error.status === 409 ? (
              <StatusMessage
                status="empty"
                title="Hóa đơn đã được thanh toán"
                message="Hóa đơn này không còn thông tin chuyển khoản. Danh sách hóa đơn đã được cập nhật."
              />
            ) : (
              <StatusMessage
                status="error"
                title="Không thể tải thông tin chuyển khoản"
                message={query.error.message}
                onRetry={query.error.status === 404 ? undefined : () => { void query.refetch(); }}
              />
            )}
          </div>
        ) : instruction ? (
          <InstructionBody instruction={instruction} />
        ) : null}
      </div>
    </TuitionModal>
  );
}
