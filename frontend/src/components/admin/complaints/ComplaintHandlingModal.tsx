"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useUpdateComplaintHandling } from "@/hooks/useComplaints";
import { toApiError } from "@/lib/axios";
import type { ComplaintResponse } from "@/types/complaint";

interface ComplaintHandlingModalProps {
  complaint: ComplaintResponse;
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  status: "InProgress" | "Resolved";
  resolution: string;
}

export function ComplaintHandlingModal({
  complaint,
  isOpen,
  onClose,
}: ComplaintHandlingModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errorAlertRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const updateMutation = useUpdateComplaintHandling();

  const {
    register,
    handleSubmit,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      status: complaint.status === "New" ? "InProgress" : "Resolved",
      resolution: complaint.resolution ?? "",
    },
  });

  const statusValue = useWatch({ control, name: "status" });
  const resolutionValue = useWatch({ control, name: "resolution" }) || "";

  // Khi chuyển sang InProgress, xóa lỗi resolution nếu có
  useEffect(() => {
    if (statusValue === "InProgress") {
      clearErrors("resolution");
    }
  }, [statusValue, clearErrors]);

  // Quản lý focus chuẩn a11y: khóa cuộn, bẫy Tab và khôi phục khi đóng
  const { containerRef } = useFocusTrap({
    isOpen,
    isLoading: updateMutation.isPending,
    onClose,
  });

  // Khôi phục focus vào khung cảnh báo lỗi khi có lỗi từ máy chủ
  useEffect(() => {
    if (submitError) {
      errorAlertRef.current?.focus();
    }
  }, [submitError]);

  if (!isOpen) return null;

  const onPreSubmit = (values: FormValues) => {
    setSubmitError(null);
    setPendingValues(values);
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingValues) return;
    try {
      await updateMutation.mutateAsync({
        id: complaint.id,
        data: {
          status: pendingValues.status,
          resolution:
            pendingValues.status === "Resolved" ? pendingValues.resolution.trim() : null,
        },
      });
      setShowConfirm(false);
      onClose();
    } catch (err: unknown) {
      setShowConfirm(false);
      const apiError = toApiError(err);
      setSubmitError(apiError.message);
    }
  };

  const isResolved = statusValue === "Resolved";

  const { ref: formTextareaRef, ...textareaRest } = register("resolution", {
    validate: (val) => {
      if (statusValue === "Resolved") {
        if (!val || !val.trim()) {
          return "Phản ánh đã xử lý xong phải kèm kết quả xử lý.";
        }
        if (val.trim().length > 2000) {
          return "Kết quả xử lý không được dài quá 2000 ký tự.";
        }
      }
      return true;
    },
  });

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          ref={containerRef}
          className="relative w-full max-w-lg rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="min-w-0 pr-2">
              <h2 id="modal-title" className="text-base font-bold text-foreground">
                Cập nhật kết quả xử lý phản ánh
              </h2>
              <p className="text-xs text-muted mt-0.5 truncate">
                Phản ánh của phụ huynh bé{" "}
                <strong className="text-foreground">{complaint.childFullName}</strong>{" "}
                {complaint.className ? `(Lớp ${complaint.className})` : "(Chưa xếp lớp)"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              aria-label="Đóng hộp thoại"
              className="w-11 h-11 min-h-11 min-w-11 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-background border border-border cursor-pointer transition-colors shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Alert thông báo lỗi submit nếu có */}
          {submitError ? (
            <div
              ref={errorAlertRef}
              tabIndex={-1}
              role="alert"
              className="p-3.5 rounded-xl bg-danger-bg border border-danger-border text-danger text-xs font-medium focus:outline-hidden"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold shrink-0">Lỗi cập nhật:</span>
                <span className="break-words wrap-anywhere min-w-0">{submitError}</span>
              </div>
            </div>
          ) : null}

          {/* Tóm tắt nội dung phản ánh gốc */}
          <div className="p-3.5 rounded-xl bg-background border border-border text-xs space-y-1.5">
            <div className="flex items-center justify-between text-muted flex-wrap gap-1">
              <span>
                Phụ huynh gửi: <strong>{complaint.submittedByFullName}</strong>
              </span>
            </div>
            <p className="text-foreground italic break-words wrap-anywhere min-w-0">
              &quot;{complaint.content}&quot;
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-4">
            {/* Lựa chọn trạng thái xử lý có fieldset + legend chuẩn a11y */}
            <fieldset className="space-y-1.5 border-0 p-0 m-0">
              <legend className="text-xs font-semibold text-foreground mb-1.5">
                Trạng thái xử lý <span className="text-danger">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 p-3 min-h-11 rounded-xl border border-border bg-background cursor-pointer hover:border-info transition-all text-xs select-none">
                  <input
                    type="radio"
                    value="InProgress"
                    {...register("status")}
                    className="w-4 h-4 accent-info shrink-0 cursor-pointer"
                  />
                  <span className="font-medium text-foreground">Đang xử lý</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 min-h-11 rounded-xl border border-border bg-background cursor-pointer hover:border-brand transition-all text-xs select-none">
                  <input
                    type="radio"
                    value="Resolved"
                    {...register("status")}
                    className="w-4 h-4 accent-brand shrink-0 cursor-pointer"
                  />
                  <span className="font-medium text-foreground">Đã xử lý xong</span>
                </label>
              </div>
            </fieldset>

            {/* Nhập nội dung kết quả xử lý */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="resolution-input" className="font-semibold text-foreground">
                  Nội dung kết quả / biện pháp xử lý{" "}
                  {isResolved ? <span className="text-danger">*</span> : null}
                </label>
                {isResolved ? (
                  <span
                    className={`text-[11px] ${
                      resolutionValue.length > 2000 ? "text-danger font-bold" : "text-muted"
                    }`}
                  >
                    {resolutionValue.length}/2000
                  </span>
                ) : null}
              </div>

              {isResolved ? (
                <>
                  <textarea
                    id="resolution-input"
                    rows={4}
                    maxLength={2000}
                    placeholder="Ghi rõ quá trình trao đổi với phụ huynh, giáo viên và phương án giải quyết..."
                    className={`w-full p-3 rounded-xl border bg-background text-xs text-foreground placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-brand transition-all resize-y ${
                      errors.resolution ? "border-danger focus:ring-danger" : "border-border"
                    }`}
                    {...textareaRest}
                    ref={(e) => {
                      formTextareaRef(e);
                      textareaRef.current = e;
                    }}
                  />
                  {errors.resolution ? (
                    <p className="text-[11px] text-danger font-medium mt-1">
                      {errors.resolution.message}
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-border bg-muted/10 text-xs text-muted">
                  <p>
                    Kết quả chỉ được ghi khi phản ánh đã xử lý xong.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={updateMutation.isPending}
                className="px-4 py-2 min-h-11 rounded-full text-xs font-semibold bg-background hover:bg-card border border-border text-foreground transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2 min-h-11 rounded-full text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {updateMutation.isPending ? "Đang lưu..." : "Xác nhận cập nhật"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ConfirmDialog xác nhận an toàn không thể hoàn tác */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Xác nhận cập nhật xử lý phản ánh"
        description={
          <div className="space-y-2 text-xs text-muted">
            {pendingValues?.status === "Resolved" ? (
              <>
                <p>
                  Bạn đang chuẩn bị chuyển phản ánh sang trạng thái <strong>Đã xử lý xong</strong> với kết quả xử lý đã nhập.
                </p>
                <p className="font-semibold text-danger">
                  ⚠️ Lưu ý: Khi đã chuyển sang &quot;Đã xử lý xong&quot;, phản ánh sẽ được hoàn tất và KHÔNG THỂ chỉnh sửa hay thay đổi nội dung được nữa.
                </p>
              </>
            ) : (
              <>
                <p>
                  Phản ánh sẽ được chuyển sang trạng thái <strong>Đang xử lý</strong> để ghi nhận việc Ban giám hiệu đang tiến hành giải quyết.
                </p>
                <p className="font-semibold text-foreground">
                  Bạn có chắc chắn muốn cập nhật trạng thái này không?
                </p>
              </>
            )}
          </div>
        }
        confirmText="Đồng ý cập nhật"
        cancelText="Xem lại"
        variant="primary"
        isLoading={updateMutation.isPending}
        onConfirm={handleConfirmSubmit}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
}
