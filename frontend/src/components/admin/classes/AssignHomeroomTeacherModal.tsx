"use client";

import React, { useState, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useAssignHomeroomTeacher } from "@/hooks/useClasses";
import { useUsers } from "@/hooks/useUsers";
import { toApiError } from "@/lib/axios";
import type { ClassResponse } from "@/types/class";

interface AssignHomeroomTeacherModalProps {
  classInfo: ClassResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AssignHomeroomTeacherModal({
  classInfo,
  isOpen,
  onClose,
  onSuccess,
}: AssignHomeroomTeacherModalProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    classInfo?.homeroomTeacher?.userId ?? ""
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const selectRef = useRef<HTMLSelectElement>(null);
  const assignMutation = useAssignHomeroomTeacher();
  const { data: users = [], isLoading: isLoadingUsers } = useUsers();

  // Lọc danh sách giáo viên đang hoạt động (role === "Teacher" và isActive === true)
  const activeTeachers = users.filter((u) => u.role === "Teacher" && u.isActive);

  const { containerRef } = useFocusTrap({
    isOpen,
    isLoading: assignMutation.isPending,
    onClose,
    initialFocusRef: selectRef,
  });

  if (!isOpen || !classInfo) return null;

  const currentTeacherId = classInfo.homeroomTeacher?.userId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!selectedTeacherId) {
      setServerError("Vui lòng chọn giáo viên để phân công làm chủ nhiệm.");
      return;
    }

    if (selectedTeacherId === currentTeacherId) {
      setServerError("Giáo viên này đã là giáo viên chủ nhiệm của lớp.");
      return;
    }

    try {
      const updatedClass = await assignMutation.mutateAsync({
        classId: classInfo.id,
        data: {
          teacherUserId: selectedTeacherId,
        },
      });

      const teacherName =
        updatedClass.homeroomTeacher?.fullName ??
        activeTeachers.find((t) => t.id === selectedTeacherId)?.fullName ??
        "giáo viên";

      onSuccess(`Đã phân công ${teacherName} làm chủ nhiệm ${classInfo.name} thành công.`);
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
      aria-labelledby="assign-teacher-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!assignMutation.isPending) onClose();
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-xl transition-all overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80 bg-[#FAFBF7]">
          <div>
            <h3 id="assign-teacher-modal-title" className="text-base font-bold text-foreground">
              {classInfo.homeroomTeacher ? "Đổi giáo viên chủ nhiệm" : "Phân công giáo viên chủ nhiệm"}
            </h3>
            <p className="text-xs text-muted mt-0.5">Khối lớp: {classInfo.name}</p>
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

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Thông tin lớp học hiện tại */}
          <div className="p-3.5 rounded-2xl bg-[#F8F8F9] border border-border space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted">Độ tuổi tiếp nhận:</span>
              <span className="font-semibold text-foreground">
                {classInfo.minAgeMonths} – {classInfo.maxAgeMonths} tháng tuổi
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">GVCN hiện tại:</span>
              <span className="font-bold text-foreground">
                {classInfo.homeroomTeacher ? (
                  classInfo.homeroomTeacher.fullName
                ) : (
                  <span className="text-[#E8916E]">Chưa phân công</span>
                )}
              </span>
            </div>
          </div>

          {/* Lựa chọn giáo viên */}
          <div className="space-y-1.5">
            <label htmlFor="teacher-select" className="text-xs font-bold text-foreground block">
              Chọn giáo viên phân công: <span className="text-danger">*</span>
            </label>
            <select
              id="teacher-select"
              ref={selectRef}
              value={selectedTeacherId}
              onChange={(e) => {
                setSelectedTeacherId(e.target.value);
                setServerError(null);
              }}
              disabled={assignMutation.isPending || isLoadingUsers}
              className="w-full h-10 px-3 rounded-xl border border-input bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
            >
              <option value="">-- Chọn giáo viên --</option>
              {activeTeachers.map((teacher) => {
                const isCurrent = teacher.id === currentTeacherId;
                return (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.fullName} ({teacher.email}){isCurrent ? " - [Hiện tại]" : ""}
                  </option>
                );
              })}
            </select>
          </div>

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
              disabled={assignMutation.isPending || !selectedTeacherId || selectedTeacherId === currentTeacherId}
              className="px-5 py-2 rounded-full text-xs font-bold text-white bg-brand hover:bg-brand-hover shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {assignMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang phân công...</span>
                </>
              ) : (
                <span>Xác nhận phân công</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
