"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { useBroadcastSchoolClosure } from "@/hooks/useNotifications";
import { SCHOOL_CLOSURE_CONTENT_MAX, SCHOOL_CLOSURE_PREFIX } from "@/types/notifications";

export interface SentClosure {
  content: string;
  recipientCount: number;
  sentAt: number;
}

interface SchoolClosureFormProps {
  lastSent: SentClosure | null;
  onSent: (result: SentClosure) => void;
}

const sentAtFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
});

const CONTENT_ID = "school-closure-content";

const BELL_PATH = "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";
const WARNING_PATH = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";

/**
 * Tin phụ huynh nhận: tiền tố cố định + nội dung, hiển thị dạng văn bản thuần (D25).
 * Tiền tố tách lên dòng đầu cho dễ đọc; chữ vẫn đúng với chuỗi backend ghép.
 */
function ClosureNotificationCard({ content }: { content: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4">
      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand">
        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={BELL_PATH} />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{SCHOOL_CLOSURE_PREFIX.trim()}</p>
        {content
          ? <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 [overflow-wrap:anywhere]">{content}</p>
          : <p className="mt-1 text-sm italic text-muted-light">Nội dung bạn nhập sẽ hiện ở đây…</p>}
      </div>
    </div>
  );
}

/**
 * FR-NOTI-03: nhập nội dung, xem lại trong hộp xác nhận rồi mới gửi, vì thông báo đã gửi không
 * sửa, không thu hồi được (BR-NOTIFICATION-03).
 */
export function SchoolClosureForm({ lastSent, onSent }: SchoolClosureFormProps) {
  const broadcast = useBroadcastSchoolClosure();
  const submitRef = useRef<HTMLButtonElement>(null);
  // Chỗ cần đưa focus về sau khi đóng hộp xác nhận; chờ hết gửi vì ô nội dung đang bị khóa.
  const refocusRef = useRef<"submit" | "content" | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const {
    register, handleSubmit, reset, setError, setFocus, control,
    formState: { errors },
  } = useForm<{ content: string }>({ defaultValues: { content: "" } });
  const content = useWatch({ control, name: "content" }) ?? "";
  const trimmed = content.trim();

  // ConfirmDialog không tự trả focus khi đóng; đưa về nút Gửi (hoặc ô nội dung khi có lỗi) để người
  // dùng bàn phím giữ vị trí.
  useEffect(() => {
    if (confirming !== null || broadcast.isPending || !refocusRef.current) return;
    const target = refocusRef.current;
    refocusRef.current = null;
    if (target === "content") setFocus("content");
    else submitRef.current?.focus();
  }, [confirming, broadcast.isPending, setFocus]);

  const closeConfirm = () => {
    if (broadcast.isPending) return;
    refocusRef.current = "submit";
    setConfirming(null);
  };

  const review = ({ content: value }: { content: string }) => {
    if (broadcast.isPending) return;
    setConfirming(value.trim());
  };

  const send = () => {
    if (confirming === null || broadcast.isPending) return;
    const sentContent = confirming;
    broadcast.mutate({ content: sentContent }, {
      onSuccess: ({ recipientCount }) => {
        setConfirming(null);
        // Gửi được thì xóa ô soạn và đưa focus về ô (nút Gửi lúc này bị khóa vì ô rỗng).
        // Chưa ai nhận thì giữ nội dung để gửi lại khi đã có tài khoản Phụ huynh.
        if (recipientCount > 0) {
          reset({ content: "" });
          refocusRef.current = "content";
        } else {
          refocusRef.current = "submit";
        }
        onSent({ content: sentContent, recipientCount, sentAt: Date.now() });
      },
      onError: (error) => {
        setConfirming(null);
        setError("content", {
          type: "server",
          message: error.errors?.length ? error.errors.join(" ") : error.message,
        });
        refocusRef.current = "content";
      },
    });
  };

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <section aria-labelledby="closure-form-title" className="min-w-0 rounded-2xl border border-brand-border bg-card p-4 shadow-xs sm:p-6">
        <h2 id="closure-form-title" className="mb-5 text-base font-semibold text-foreground">Soạn thông báo</h2>
        <form noValidate onSubmit={handleSubmit(review)} className="space-y-5">
          <FormField
            id={CONTENT_ID} label="Nội dung thông báo" required error={errors.content?.message}
            hint="Ghi rõ ngày nghỉ, lý do và ngày học lại"
          >
            <Textarea
              id={CONTENT_ID}
              rows={6}
              placeholder="Ví dụ: Thứ Hai 01/12 trường nghỉ học do mất điện. Các bé đi học lại vào Thứ Ba 02/12."
              maxLength={SCHOOL_CLOSURE_CONTENT_MAX}
              showCount
              currentLength={content.length}
              disabled={broadcast.isPending}
              error={errors.content?.message}
              aria-invalid={!!errors.content}
              className="min-h-40 resize-y leading-relaxed"
              {...register("content", {
                validate: (value) => {
                  const text = value.trim();
                  if (!text) return "Nội dung thông báo không được để trống.";
                  return text.length <= SCHOOL_CLOSURE_CONTENT_MAX
                    || `Nội dung thông báo không được dài quá ${SCHOOL_CLOSURE_CONTENT_MAX} ký tự.`;
                },
              })}
            />
          </FormField>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              className="whitespace-nowrap"
              disabled={broadcast.isPending || !content}
              onClick={() => {
                reset({ content: "" });
                // Nút này tự khóa khi ô rỗng; đưa focus về ô để gõ lại ngay. setFocus của RHF không
                // chạy ngay sau reset nên focus thẳng vào ô.
                document.getElementById(CONTENT_ID)?.focus();
              }}
            >
              Xóa nội dung
            </Button>
            <Button ref={submitRef} type="submit" className="whitespace-nowrap sm:min-w-40" disabled={!trimmed} isLoading={broadcast.isPending}>
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 12 3.27 3.13a59.77 59.77 0 0 1 18.22 8.87 59.77 59.77 0 0 1-18.22 8.88L6 12Zm0 0h7.5" />
              </svg>
              Gửi thông báo
            </Button>
          </div>
        </form>
      </section>

      <aside className="flex min-w-0 flex-col gap-5">
        <section aria-labelledby="closure-preview-title" className="flex flex-1 flex-col rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <h2 id="closure-preview-title" className="text-base font-semibold text-foreground">Xem trước</h2>
          <p className="mt-0.5 text-xs text-muted sm:text-sm">Tin phụ huynh nhận trong mục Thông báo.</p>
          <div className="mt-4 flex-1 rounded-xl bg-background p-3 sm:p-4">
            <ClosureNotificationCard content={trimmed} />
          </div>
        </section>

        {lastSent && (
          <section
            key={lastSent.sentAt}
            aria-labelledby="closure-last-title"
            role={lastSent.recipientCount === 0 ? "alert" : undefined}
            className={lastSent.recipientCount > 0
              ? "rounded-2xl border border-brand-border bg-brand-subtle p-4 sm:p-5"
              : "rounded-2xl border border-warning-border bg-warning-bg p-4 sm:p-5"}
          >
            <h2 id="closure-last-title" className="text-sm font-semibold text-foreground">Lần gửi vừa rồi</h2>
            <p className="mt-1 text-xs text-muted tabular-nums">{sentAtFormatter.format(lastSent.sentAt)}</p>
            {lastSent.recipientCount > 0 ? (
              <p className="mt-2 text-sm text-brand-text">
                Đã gửi tới toàn bộ phụ huynh đang hoạt động
                (<strong className="font-semibold tabular-nums">{lastSent.recipientCount}</strong> tài khoản).
              </p>
            ) : (
              <p className="mt-2 text-sm text-amber-800">
                Chưa có phụ huynh nào nhận thông báo vì hệ thống chưa có tài khoản Phụ huynh đang hoạt động.
                Nội dung vẫn được giữ trong ô soạn để gửi lại sau.
              </p>
            )}
            <p className="mt-2 line-clamp-3 text-xs text-muted whitespace-pre-wrap [overflow-wrap:anywhere]">{lastSent.content}</p>
          </section>
        )}
      </aside>

      <ConfirmDialog
        isOpen={confirming !== null}
        title="Gửi thông báo nghỉ học?"
        layout="stacked"
        confirmText="Gửi thông báo"
        cancelText="Quay lại"
        isLoading={broadcast.isPending}
        onConfirm={send}
        onClose={closeConfirm}
        description={confirming !== null && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              Thông báo dưới đây sẽ được gửi tới <strong className="font-semibold text-foreground">tất cả phụ huynh của trường</strong>.
            </p>
            {/* ConfirmDialog không tự cuộn: giới hạn khung nội dung để nút gửi luôn nằm trong màn hình nhỏ. */}
            <div className="max-h-[calc(100dvh-24rem)] overflow-y-auto overscroll-contain rounded-xl bg-background p-2.5">
              <ClosureNotificationCard content={confirming} />
            </div>
            <p className="flex items-start gap-2 rounded-lg border border-warning-border bg-warning-bg px-3 py-2.5 text-xs leading-relaxed text-amber-800">
              <svg aria-hidden="true" className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={WARNING_PATH} />
              </svg>
              <span><strong className="font-semibold">Không thể thu hồi hoặc chỉnh sửa sau khi gửi.</strong> Hãy kiểm tra kỹ ngày nghỉ và nội dung trước khi xác nhận.</span>
            </p>
          </div>
        )}
      />
    </div>
  );
}
