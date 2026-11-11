"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useUpdateComplaintHandling } from "@/hooks/useComplaints";
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
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      status: complaint.status === "Pending" ? "InProgress" : complaint.status,
      resolution: complaint.resolution ?? "",
    },
  });

  const resolutionValue = useWatch({ control, name: "resolution" }) || "";

  // Quản lý focus chuẩn a11y: khóa cuộn, bẫy Tab và khôi phục khi đóng
  const { containerRef } = useFocusTrap({
    isOpen,
    isLoading: updateMutation.isPending,
    onClose,
    initialFocusRef: textareaRef,
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
          resolution: pendingValues.resolution.trim(),
        },
      });
      setShowConfirm(false);
      onClose();
    } catch (err: unknown) {
      setShowConfirm(false);
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật phản ánh.";
      setSubmitError(msg);
    }
  };

  const { ref: formTextareaRef, ...textareaRest } = register("resolution", {
    required: "Vui lòng nhập nội dung kết quả xử lý.",
    validate: (val) => {
      if (!val || !val.trim()) {
        return "Nội dung kết quả xử lý không được để trống.";
      }
      if (val.trim().length > 2000) {
        return "Kết quả xử lý không được vượt quá 2000 ký tự.";
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
                <strong className="text-foreground">{complaint.child.fullName}</strong> ({complaint.child.className})
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
              <span>Phụ huynh: <strong>{complaint.parent.fullName}</strong></span>
              <span>{complaint.parent.phone ? `SĐT: ${complaint.parent.phone}` : ""}</span>
            </div>
            <p className="text-foreground italic break-words wrap-anywhere min-w-0">
              &quot;{complaint.content}&quot;
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-4">
            {/* Lựa chọn trạng thái xử lý */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Trạng thái xử lý <span className="text-danger">*</span>
              </label>
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
            </div>

            {/* Nhập nội dung kết quả xử lý */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="resolution-input" className="font-semibold text-foreground">
                  Nội dung kết quả / biện pháp xử lý <span className="text-danger">*</span>
                </label>
                <span
                  className={`text-[11px] ${
                    resolutionValue.length > 2000 ? "text-danger font-bold" : "text-muted"
                  }`}
                >
                  {resolutionValue.length}/2000
                </span>
              </div>
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
            <p>
              Trạng thái phản ánh và kết quả xử lý sau khi xác nhận sẽ được ghi nhận chính thức vào hồ sơ điều hành của nhà trường.
            </p>
            <p className="font-semibold text-warning">
              ⚠️ Bạn có chắc chắn muốn cập nhật trạng thái này không?
            </p>
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
