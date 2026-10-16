"use client";

import React, { useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useAssignClass } from "@/hooks/useClasses";
import { calculateAgeInMonths, fitsAgeRange, formatDate, formatAgeFriendly } from "@/lib/classAge";
import { toApiError } from "@/lib/axios";
import type { ClassResponse, ClassPlacementResponse } from "@/types/class";

interface AssignClassModalProps {
  placement: ClassPlacementResponse | null;
  classes: ClassResponse[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AssignClassModal({
  placement,
  classes,
  isOpen,
  onClose,
  onSuccess,
}: AssignClassModalProps) {
  // classId được chọn; null biểu thị hành động gỡ trẻ khỏi lớp
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    placement?.classId ?? null
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const assignMutation = useAssignClass();

  const { containerRef } = useFocusTrap({
    isOpen,
    isLoading: assignMutation.isPending,
    onClose,
  });

  if (!isOpen || !placement) return null;

  const ageInMonths = calculateAgeInMonths(placement.dateOfBirth);
  const currentClassId = placement.classId;

  // Tìm lớp được đề xuất tự động dựa trên độ tuổi nửa mở [min, max)
  const suggestedClass = classes.find((c) =>
    fitsAgeRange(ageInMonths, c.minAgeMonths, c.maxAgeMonths)
  );

  const isNoChange = selectedClassId === currentClassId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (isNoChange) {
      if (selectedClassId === null) {
        setServerError("Trẻ chưa được xếp lớp.");
      } else {
        setServerError("Trẻ đã ở lớp này.");
      }
      return;
    }

    try {
      const updatedPlacement = await assignMutation.mutateAsync({
        childId: placement.childId,
        data: {
          classId: selectedClassId,
        },
      });

      if (updatedPlacement.classId) {
        onSuccess(`Đã xếp bé ${updatedPlacement.fullName} vào ${updatedPlacement.className} thành công.`);
      } else {
        onSuccess(`Đã gỡ bé ${updatedPlacement.fullName} khỏi lớp học thành công.`);
      }

      onClose();
    } catch (err) {
      const apiErr = toApiError(err);
      setServerError(apiErr.message);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="assign-class-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!assignMutation.isPending) onClose();
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-xl transition-all overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80 bg-[#FAFBF7]">
          <div>
            <h3 id="assign-class-modal-title" className="text-base font-bold text-foreground">
              {placement.classId ? "Chuyển lớp học cho trẻ" : "Xếp trẻ vào lớp học"}
            </h3>
            <p className="text-xs text-muted mt-0.5">Bé: {placement.fullName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={assignMutation.isPending}
            className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-black/5 transition-all"
            aria-label="Đóng hộp thoại"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Thông tin trẻ (Tối thiểu theo AC-CLASS-04) */}
          <div className="p-4 rounded-2xl bg-[#F8F8F9] border border-border space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Họ và tên trẻ:</span>
              <span className="font-bold text-foreground text-sm">{placement.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Ngày sinh:</span>
              <span className="font-semibold text-foreground">
                {formatDate(placement.dateOfBirth)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Độ tuổi hiện tại:</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-brand bg-brand-subtle px-2.5 py-0.5 rounded-full">
                <span>🎂</span>
                <span>{formatAgeFriendly(ageInMonths)}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Lớp hiện tại:</span>
              <span className="font-semibold text-foreground">
                {placement.className ?? (
                  <span className="text-muted italic">Chưa xếp lớp</span>
                )}
              </span>
            </div>
          </div>

          {/* Hướng dẫn lựa chọn lớp */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Chọn lớp học theo độ tuổi: <span className="text-danger">*</span>
            </label>

            <div className="space-y-2.5">
              {classes.map((cls) => {
                const isSelected = selectedClassId === cls.id;
                const isCurrent = placement.classId === cls.id;
                const fits = fitsAgeRange(ageInMonths, cls.minAgeMonths, cls.maxAgeMonths);

                const isMam = cls.name.includes("Mầm");
                const isChoi = cls.name.includes("Chồi");
                const classIcon = isMam ? "🌱" : isChoi ? "🌿" : "🍃";

                return (
                  <div
                    key={cls.id}
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setServerError(null);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                      ? "border-brand bg-brand-subtle/40 ring-1 ring-brand"
                      : "border-border hover:border-border/80 bg-card hover:bg-[#F8F8F9]"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="class-selection"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedClassId(cls.id);
                          setServerError(null);
                        }}
                        className="w-4 h-4 text-brand focus:ring-brand"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span>{classIcon}</span>
                            <span>{cls.name}</span>
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700">
                              Lớp hiện tại
                            </span>
                          )}
                          {fits && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/60">
                              ✓ Khớp độ tuổi
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted mt-0.5">
                          Độ tuổi quy định: {cls.minAgeMonths ?? 0} ≤ tuổi &lt; {cls.maxAgeMonths ?? 0} tháng
                        </p>
                      </div>
                    </div>

                    {!fits && (
                      <span className="text-[10px] text-[#E8916E] font-medium shrink-0">
                        Khác nhóm tuổi
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Tùy chọn Gỡ khỏi lớp nếu trẻ đã có lớp */}
              {placement.classId && (
                <div
                  onClick={() => {
                    setSelectedClassId(null);
                    setServerError(null);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${selectedClassId === null
                    ? "border-danger bg-danger-bg ring-1 ring-danger"
                    : "border-dashed border-border hover:border-danger/40 bg-card hover:bg-danger-bg/20"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="class-selection"
                      checked={selectedClassId === null}
                      onChange={() => {
                        setSelectedClassId(null);
                        setServerError(null);
                      }}
                      className="w-4 h-4 text-danger focus:ring-danger"
                    />
                    <div>
                      <span className="text-xs font-bold text-danger">Gỡ trẻ khỏi lớp</span>
                      <p className="text-[11px] text-muted mt-0.5">
                        Chuyển trẻ về trạng thái &quot;Chưa xếp lớp&quot; (dành cho trẻ tạm nghỉ hoặc chờ xếp lại)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gợi ý nếu chọn lớp không khớp độ tuổi */}
          {selectedClassId !== null &&
            !fitsAgeRange(
              ageInMonths,
              classes.find((c) => c.id === selectedClassId)?.minAgeMonths ?? null,
              classes.find((c) => c.id === selectedClassId)?.maxAgeMonths ?? null
            ) && (
              <div className="p-3 rounded-xl bg-[#FFF9E6] border border-[#FFF3DD] text-[11px] text-[#7A5B00] flex items-start gap-2">
                <span className="shrink-0 mt-0.5">💡</span>
                <div className="leading-relaxed">
                  Lưu ý: Bé hiện tại là {ageInMonths} tháng tuổi. Lớp này không khớp độ tuổi.
                  {suggestedClass
                    ? ` Độ tuổi của bé phù hợp nhất với ${suggestedClass.name} (${suggestedClass.minAgeMonths}–${suggestedClass.maxAgeMonths} tháng).`
                    : " Bé hiện không nằm trong độ tuổi 36–72 tháng của trường."}
                </div>
              </div>
            )}

          {/* Thông báo lỗi từ server */}
          {serverError && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <div className="leading-relaxed">{serverError}</div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={assignMutation.isPending}
              className="px-4 py-2 rounded-full text-xs font-semibold text-muted hover:text-foreground hover:bg-black/5 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={assignMutation.isPending || isNoChange}
              className={`px-5 py-2 rounded-full text-xs font-bold text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 ${selectedClassId === null
                ? "bg-danger hover:bg-danger-hover"
                : "bg-brand hover:bg-brand-hover"
                }`}
            >
              {assignMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : selectedClassId === null ? (
                <span>Xác nhận gỡ lớp</span>
              ) : (
                <span>Xác nhận xếp lớp</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
