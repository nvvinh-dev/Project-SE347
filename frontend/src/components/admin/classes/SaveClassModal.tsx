"use client";

import React, { useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useCreateClass, useUpdateClass } from "@/hooks/useClasses";
import { getGradeLevelTheme } from "@/lib/classAge";
import { toApiError } from "@/lib/axios";
import type { ClassResponse, GradeLevelResponse, SaveClassRequest } from "@/types/class";

interface SaveClassModalProps {
  mode: "create" | "edit";
  classInfo?: ClassResponse | null;
  gradeLevels: GradeLevelResponse[];
  defaultGradeLevelId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface SaveClassFormValues {
  gradeLevelId: string;
  name: string;
}

export function SaveClassModal({
  mode,
  classInfo = null,
  gradeLevels,
  defaultGradeLevelId,
  isOpen,
  onClose,
  onSuccess,
}: SaveClassModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const isEdit = mode === "edit" && classInfo !== null;
  const hasChildren = isEdit && (classInfo?.childCount ?? 0) > 0;

  const initialGradeLevelId = isEdit
    ? String(classInfo.gradeLevel.id)
    : defaultGradeLevelId
      ? String(defaultGradeLevelId)
      : gradeLevels[0]
        ? String(gradeLevels[0].id)
        : "";

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SaveClassFormValues>({
    defaultValues: {
      gradeLevelId: initialGradeLevelId,
      name: isEdit ? classInfo.name : "",
    },
  });

  const watchedGradeLevelId = useWatch({ control, name: "gradeLevelId" });
  const watchedName = useWatch({ control, name: "name" }) ?? "";

  const handleClose = useCallback(() => {
    if (isPending) return;
    setServerError(null);
    onClose();
  }, [isPending, onClose]);

  const { containerRef } = useFocusTrap({
    isOpen,
    isLoading: isPending,
    onClose: handleClose,
  });

  if (!isOpen) return null;
  if (mode === "edit" && !classInfo) return null;

  const selectedGradeLevel =
    gradeLevels.find((gl) => String(gl.id) === watchedGradeLevelId) ??
    (isEdit ? gradeLevels.find((gl) => gl.id === classInfo.gradeLevel.id) : undefined);

  const selectedTheme = selectedGradeLevel
    ? getGradeLevelTheme({
        gradeLevelId: selectedGradeLevel.id,
        minAgeMonths: selectedGradeLevel.minAgeMonths,
        maxAgeMonths: selectedGradeLevel.maxAgeMonths,
        name: selectedGradeLevel.name,
      })
    : null;

  const gradeLevelField = register("gradeLevelId", {
    validate: (value) => {
      if (hasChildren) return true;
      return Number(value) > 0 || "Vui lòng chọn khối lớp.";
    },
  });

  const nameField = register("name", {
    validate: {
      requiredTrimmed: (value) =>
        value.trim().length > 0 || "Tên lớp không được để trống.",
      maxTrimmed: (value) =>
        value.trim().length <= 100 || "Tên lớp tối đa 100 ký tự.",
    },
  });

  const onSubmit = async (values: SaveClassFormValues) => {
    setServerError(null);

    // Khi lớp đã có trẻ, khóa đổi khối ở UI nhưng vẫn giữ nguyên gradeLevelId hiện tại khi gửi PUT
    const resolvedGradeLevelId =
      hasChildren && classInfo ? classInfo.gradeLevel.id : Number(values.gradeLevelId);

    const payload: SaveClassRequest = {
      gradeLevelId: resolvedGradeLevelId,
      name: values.name.trim(),
      minCapacity: isEdit && classInfo ? classInfo.minCapacity : null,
      maxCapacity: isEdit && classInfo ? classInfo.maxCapacity : null,
    };

    try {
      if (isEdit && classInfo) {
        const updated = await updateMutation.mutateAsync({
          classId: classInfo.id,
          data: payload,
        });
        onSuccess(
          `Đã cập nhật lớp "${updated.name}" (Khối ${updated.gradeLevel.name}) thành công.`
        );
      } else {
        const created = await createMutation.mutateAsync(payload);
        onSuccess(
          `Đã tạo lớp "${created.name}" thuộc Khối ${created.gradeLevel.name} thành công.`
        );
      }
      onClose();
    } catch (err) {
      // Giữ nguyên dữ liệu người dùng đã nhập khi backend trả lỗi 400/404/409 để dễ chỉnh sửa
      setServerError(toApiError(err).message);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="save-class-modal-title"
    >
      {/* Lớp nền mờ */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Khối hộp thoại tạo / sửa lớp */}
      <div className="relative z-10 w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-xl transition-all overflow-hidden">
        {/* Tiêu đề hộp thoại */}
        <div className="flex items-center justify-between p-5 border-b border-border/80 bg-[#FAFBF7]">
          <div>
            <h3 id="save-class-modal-title" className="text-base font-bold text-foreground">
              {isEdit ? "Chỉnh sửa thông tin lớp học" : "Tạo lớp học mới"}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {isEdit
                ? `Lớp hiện tại: ${classInfo.name} · Khối ${classInfo.gradeLevel.name}`
                : "Chọn 1 trong 3 khối cố định và đặt tên lớp học."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-black/5 transition-all cursor-pointer disabled:opacity-50"
            aria-label="Đóng hộp thoại"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thân biểu mẫu */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Trường 1: Khối lớp */}
          <div className="space-y-1.5">
            <label
              htmlFor="save-class-grade-level"
              className="text-xs font-bold text-foreground block"
            >
              Khối lớp <span className="text-danger">*</span>
            </label>

            <select
              id="save-class-grade-level"
              disabled={isPending || hasChildren || gradeLevels.length === 0}
              {...gradeLevelField}
              onChange={(e) => {
                gradeLevelField.onChange(e);
                setServerError(null);
              }}
              className="w-full h-10 px-3.5 rounded-2xl border border-border bg-[#FAFBF7] text-xs font-semibold text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-65 disabled:cursor-not-allowed transition-all"
            >
              {gradeLevels.length === 0 ? (
                <option value="">Đang tải danh sách khối...</option>
              ) : (
                gradeLevels.map((gl) => (
                  <option key={gl.id} value={String(gl.id)}>
                    Khối {gl.name} ({gl.minAgeMonths}–{gl.maxAgeMonths} tháng tuổi)
                  </option>
                ))
              )}
            </select>

            {errors.gradeLevelId?.message && (
              <p className="text-[11px] font-medium text-danger">{errors.gradeLevelId.message}</p>
            )}

            {hasChildren && classInfo ? (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">ℹ️</span>
                <span>
                  Lớp đang có <strong>{classInfo.childCount}</strong> trẻ nên chỉ đổi khối khi lớp chưa có trẻ.
                </span>
              </div>
            ) : selectedGradeLevel && selectedTheme ? (
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${selectedTheme.badgeBg} ${selectedTheme.badgeText} ${selectedTheme.badgeBorder}`}>
                <span>{selectedTheme.icon}</span>
                <span>
                  Độ tuổi áp dụng cho lớp: <strong>{selectedGradeLevel.minAgeMonths} ≤ tuổi &lt; {selectedGradeLevel.maxAgeMonths} tháng</strong>
                </span>
              </div>
            ) : null}
          </div>

          {/* Trường 2: Tên lớp */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="save-class-name"
                className="text-xs font-bold text-foreground block"
              >
                Tên lớp học <span className="text-danger">*</span>
              </label>
              <span
                className={`text-[10px] font-medium ${
                  watchedName.trim().length > 100 ? "text-danger" : "text-muted"
                }`}
              >
                {watchedName.trim().length}/100
              </span>
            </div>

            <input
              id="save-class-name"
              type="text"
              placeholder="Ví dụ: Mầm 2, Chồi Hoa Sen..."
              disabled={isPending}
              {...nameField}
              onChange={(e) => {
                nameField.onChange(e);
                setServerError(null);
              }}
              className="w-full h-10 px-3.5 rounded-2xl border border-border bg-card text-xs font-medium text-foreground placeholder:text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-65 transition-all"
            />

            {errors.name?.message ? (
              <p className="text-[11px] font-medium text-danger">{errors.name.message}</p>
            ) : (
              <p className="text-[11px] text-muted">
                Tên lớp phải là duy nhất trên toàn trường (kể cả lớp đã lưu trữ).
              </p>
            )}
          </div>

          {/* Thông báo lỗi từ server (400 / 404 / 409) */}
          {serverError && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <div className="leading-relaxed">{serverError}</div>
            </div>
          )}

          {/* Các nút thao tác cuối hộp thoại */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 rounded-full text-xs font-semibold text-muted hover:text-foreground hover:bg-black/5 transition-all cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isPending || (!isEdit && gradeLevels.length === 0)}
              className="px-5 py-2 rounded-full text-xs font-bold text-white bg-brand hover:bg-brand-hover shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : isEdit ? (
                <span>Lưu thay đổi</span>
              ) : (
                <span>Tạo lớp học</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
