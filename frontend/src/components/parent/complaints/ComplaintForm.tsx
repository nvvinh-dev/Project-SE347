"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { useCreateComplaint } from "@/hooks/useComplaints";
import { COMPLAINT_CONTENT_MAX } from "@/types/complaints";
import type { MyChildResponse } from "@/types/children";

const CONTENT_ID = "complaint-content";
const WARNING_PATH = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";

interface ComplaintFormProps {
  child: MyChildResponse;
  onSent: (childName: string) => void;
}

/**
 * FR-COMPLAINT-01: nhập nội dung, xem lại trong hộp xác nhận rồi mới gửi, vì phản ánh đã gửi không
 * sửa, không xóa được (D39 mục 18).
 */
export function ComplaintForm({ child, onSent }: ComplaintFormProps) {
  const create = useCreateComplaint();
  const submitRef = useRef<HTMLButtonElement>(null);
  // Chỗ cần đưa focus về sau khi đóng hộp xác nhận; chờ hết gửi vì ô nội dung đang bị khóa.
  const refocusRef = useRef<"submit" | "content" | null>(null);
  // Giữ trẻ lúc bấm Gửi để hộp xác nhận và request luôn cùng một trẻ.
  const [confirming, setConfirming] = useState<{ child: MyChildResponse; content: string } | null>(null);

  const {
    register, handleSubmit, reset, setError, setFocus, control,
    formState: { errors },
  } = useForm<{ content: string }>({ defaultValues: { content: "" } });
  const content = useWatch({ control, name: "content" }) ?? "";
  const trimmed = content.trim();

  // ConfirmDialog không tự trả focus khi đóng; đưa về nút Gửi (hoặc ô nội dung) để người dùng bàn phím
  // giữ vị trí.
  useEffect(() => {
    if (confirming !== null || create.isPending || !refocusRef.current) return;
    const target = refocusRef.current;
    refocusRef.current = null;
    if (target === "content") setFocus("content");
    else submitRef.current?.focus();
  }, [confirming, create.isPending, setFocus]);

  const closeConfirm = () => {
    if (create.isPending) return;
    refocusRef.current = "submit";
    setConfirming(null);
  };

  const review = ({ content: value }: { content: string }) => {
    if (create.isPending) return;
    setConfirming({ child, content: value.trim() });
  };

  const send = () => {
    if (!confirming || create.isPending) return;
    const target = confirming;
    create.mutate({ childId: target.child.id, data: { content: target.content } }, {
      onSuccess: () => {
        setConfirming(null);
        // Gửi xong xóa ô soạn; nút Gửi lúc này bị khóa vì ô rỗng nên đưa focus về ô.
        reset({ content: "" });
        refocusRef.current = "content";
        onSent(target.child.fullName);
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
    <section aria-labelledby="complaint-form-title" className="min-w-0 rounded-2xl border border-brand-border bg-card p-4 shadow-xs sm:p-5">
      <h2 id="complaint-form-title" className="text-base font-semibold text-foreground">Gửi phản ánh mới</h2>
      <p className="mt-0.5 text-xs leading-relaxed text-muted sm:text-sm">
        Phản ánh được gửi thẳng tới Ban giám hiệu, không qua giáo viên.
      </p>

      <form noValidate onSubmit={handleSubmit(review)} className="mt-5 space-y-5">
        <FormField id={CONTENT_ID} label="Nội dung phản ánh" required error={errors.content?.message}>
          <Textarea
            id={CONTENT_ID}
            rows={7}
            placeholder="Mô tả rõ sự việc, thời gian xảy ra và mong muốn của phụ huynh."
            maxLength={COMPLAINT_CONTENT_MAX}
            showCount
            currentLength={content.length}
            disabled={create.isPending}
            error={errors.content?.message}
            aria-invalid={!!errors.content}
            className="min-h-44 resize-y leading-relaxed"
            {...register("content", {
              validate: (value) => {
                const text = value.trim();
                if (!text) return "Nội dung phản ánh không được để trống.";
                return text.length <= COMPLAINT_CONTENT_MAX
                  || `Nội dung phản ánh không được dài quá ${COMPLAINT_CONTENT_MAX} ký tự.`;
              },
            })}
          />
        </FormField>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            className="whitespace-nowrap"
            disabled={create.isPending || !content}
            onClick={() => {
              reset({ content: "" });
              // Nút này tự khóa khi ô rỗng; setFocus của RHF không chạy ngay sau reset nên focus thẳng vào ô.
              document.getElementById(CONTENT_ID)?.focus();
            }}
          >
            Xóa nội dung
          </Button>
          <Button ref={submitRef} type="submit" className="whitespace-nowrap sm:min-w-36" disabled={!trimmed} isLoading={create.isPending}>
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 12 3.27 3.13a59.77 59.77 0 0 1 18.22 8.87 59.77 59.77 0 0 1-18.22 8.88L6 12Zm0 0h7.5" />
            </svg>
            Gửi phản ánh
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={confirming !== null}
        title="Gửi phản ánh tới Ban giám hiệu?"
        layout="stacked"
        confirmText="Gửi phản ánh"
        cancelText="Quay lại"
        isLoading={create.isPending}
        onConfirm={send}
        onClose={closeConfirm}
        description={confirming && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              Phản ánh dưới đây về bé <strong className="font-semibold text-foreground [overflow-wrap:anywhere]">{confirming.child.fullName}</strong> sẽ được gửi tới Ban giám hiệu.
            </p>
            {/* ConfirmDialog không tự cuộn: giới hạn khung nội dung để nút gửi luôn nằm trong màn hình nhỏ. */}
            <div className="max-h-[calc(100dvh-24rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-background p-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">{confirming.content}</p>
            </div>
            <p className="flex items-start gap-2 rounded-lg border border-warning-border bg-warning-bg px-3 py-2.5 text-xs leading-relaxed text-amber-800">
              <svg aria-hidden="true" className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={WARNING_PATH} />
              </svg>
              <span><strong className="font-semibold">Không thể sửa hoặc xóa sau khi gửi.</strong> Hãy kiểm tra kỹ nội dung trước khi xác nhận.</span>
            </p>
          </div>
        )}
      />
    </section>
  );
}
