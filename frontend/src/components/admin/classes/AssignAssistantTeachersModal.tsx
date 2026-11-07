"use client";

import React, { useState, useRef, useMemo } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useAssignAssistantTeachers } from "@/hooks/useClasses";
import { useUsers } from "@/hooks/useUsers";
import { toApiError } from "@/lib/axios";
import type { ClassResponse } from "@/types/class";

interface AssignAssistantTeachersModalProps {
  classInfo: ClassResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AssignAssistantTeachersModal({
  classInfo,
  isOpen,
  onClose,
  onSuccess,
}: AssignAssistantTeachersModalProps) {
  // Danh sách ID các giáo viên phụ được chọn (khởi tạo từ classInfo khi mount theo key={classInfo.id})
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>(
    () => classInfo?.assistantTeachers?.map((t) => t.userId) ?? []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  const assignMutation = useAssignAssistantTeachers();
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: errorUsers,
    refetch: refetchUsers,
  } = useUsers();

  // Lọc danh sách tài khoản vai trò Teacher đang hoạt động
  const activeTeachers = useMemo(() => {
    return users.filter((u) => u.role === "Teacher" && u.isActive);
  }, [users]);

  // Ràng buộc loại trừ: Bỏ GVCN hiện tại của chính lớp đó ra khỏi danh sách chọn
  const eligibleTeachers = useMemo(() => {
    const homeroomId = classInfo?.homeroomTeacher?.userId;
    return activeTeachers.filter((t) => t.id !== homeroomId);
  }, [activeTeachers, classInfo?.homeroomTeacher?.userId]);

  // Lọc theo từ khóa tìm kiếm (họ tên hoặc email)
  const filteredTeachers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return eligibleTeachers;
    return eligibleTeachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term)
    );
  }, [eligibleTeachers, searchTerm]);

  // Quản lý Focus chuẩn a11y: Bẫy focus và khôi phục khi đóng
  const { containerRef } = useFocusTrap({
    isOpen,
    isLoading: assignMutation.isPending,
    onClose,
    initialFocusRef: isLoadingUsers ? undefined : searchInputRef,
  });

  if (!isOpen || !classInfo) return null;

  const handleToggle = (teacherId: string) => {
    if (assignMutation.isPending) return;
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
    setServerError(null);
  };

  const handleSelectAllFiltered = () => {
    if (assignMutation.isPending) return;
    const filteredIds = filteredTeachers.map((t) => t.id);
    setSelectedTeacherIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    setServerError(null);
  };

  const handleDeselectAll = () => {
    if (assignMutation.isPending) return;
    setSelectedTeacherIds([]);
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    try {
      const updatedClass = await assignMutation.mutateAsync({
        classId: classInfo.id,
        data: {
          teacherUserIds: selectedTeacherIds,
        },
      });

      const count = updatedClass.assistantTeachers?.length ?? selectedTeacherIds.length;
      if (count > 0) {
        onSuccess(
          `Đã phân công ${count} giáo viên phụ cho ${classInfo.name} thành công.`
        );
      } else {
        onSuccess(
          `Đã gỡ toàn bộ giáo viên phụ khỏi ${classInfo.name}.`
        );
      }
      onClose();
    } catch (err) {
      const apiErr = toApiError(err);
      setServerError(apiErr.message);
      // Khôi phục focus về nút Submit trong khối catch để tránh rơi focus (chuẩn a11y)
      submitBtnRef.current?.focus();
    }
  };

  const allFilteredSelected =
    filteredTeachers.length > 0 &&
    filteredTeachers.every((t) => selectedTeacherIds.includes(t.id));

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="assign-assistant-modal-title"
    >
      {/* Lớp nền mờ */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!assignMutation.isPending) onClose();
        }}
      />

      {/* Khối hộp thoại */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-xl transition-all overflow-hidden">
        {/* Tiêu đề hộp thoại */}
        <div className="flex items-center justify-between p-5 border-b border-border/80 bg-[#FAFBF7]">
          <div>
            <h3 id="assign-assistant-modal-title" className="text-base font-bold text-foreground">
              Phân công giáo viên phụ
            </h3>
            <p className="text-xs text-muted mt-0.5">Khối lớp: {classInfo.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={assignMutation.isPending}
            className="p-1.5 rounded-full text-muted hover:text-foreground hover:bg-black/5 transition-all cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thân biểu mẫu */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Thông tin lớp học & GVCN hiện tại */}
          <div className="p-3.5 rounded-2xl bg-[#F8F8F9] border border-border space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted">Độ tuổi tiếp nhận:</span>
              <span className="font-semibold text-foreground">
                {classInfo.minAgeMonths} – {classInfo.maxAgeMonths} tháng tuổi
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted">Giáo viên chủ nhiệm (GVCN):</span>
              <span className="font-bold text-foreground">
                {classInfo.homeroomTeacher ? (
                  <>
                    <span>{classInfo.homeroomTeacher.fullName}</span>{" "}
                    <span className="text-[11px] text-muted font-normal">
                      (Không thuộc diện GV phụ)
                    </span>
                  </>
                ) : (
                  <span className="text-[#E8916E]">Chưa phân công</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
              <span className="text-muted">Số lượng GV phụ được chọn:</span>
              <span className="font-bold text-brand">
                {selectedTeacherIds.length} giáo viên
              </span>
            </div>
          </div>

          {/* Ô tìm kiếm & Các nút thao tác chọn nhanh */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="teacher-search-input" className="text-xs font-bold text-foreground block">
                Danh sách giáo viên có thể phân công:
              </label>

              {eligibleTeachers.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={allFilteredSelected ? handleDeselectAll : handleSelectAllFiltered}
                    disabled={assignMutation.isPending || filteredTeachers.length === 0}
                    className="text-[11px] font-semibold text-brand hover:text-brand-hover hover:underline transition-all cursor-pointer disabled:opacity-50"
                  >
                    {allFilteredSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                  {selectedTeacherIds.length > 0 && !allFilteredSelected && (
                    <>
                      <span className="text-muted">•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        disabled={assignMutation.isPending}
                        className="text-[11px] font-semibold text-muted hover:text-danger hover:underline transition-all cursor-pointer disabled:opacity-50"
                      >
                        Bỏ chọn hết ({selectedTeacherIds.length})
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative">
              <input
                id="teacher-search-input"
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={assignMutation.isPending || isLoadingUsers}
                placeholder="Tìm kiếm theo họ tên hoặc email giáo viên..."
                className="w-full h-9.5 pl-9 pr-8 rounded-xl border border-input bg-card text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
              />
              <svg
                className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1 rounded-full"
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Danh sách giáo viên (Multi-select) */}
          <div className="space-y-2">
            {isLoadingUsers ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-7 h-7 border-3 border-brand/30 border-t-brand rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted">Đang tải danh sách giáo viên...</p>
              </div>
            ) : isErrorUsers ? (
              <div className="p-3.5 rounded-2xl bg-danger-bg border border-danger-border text-xs text-danger flex items-center justify-between gap-3">
                <span>⚠️ {toApiError(errorUsers).message}</span>
                <button
                  type="button"
                  onClick={() => refetchUsers()}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-danger text-white hover:bg-danger-hover transition-all shrink-0 cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : eligibleTeachers.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#FAFBF7] border border-dashed border-[#ECEDEC] space-y-2">
                <span className="text-2xl">👩‍🏫</span>
                <p className="text-xs font-bold text-foreground">Không có giáo viên khả dụng</p>
                <p className="text-[11px] text-muted max-w-xs mx-auto leading-relaxed">
                  Hiện chưa có giáo viên nào khác đang hoạt động trong hệ thống hoặc giáo viên đã được phân công làm chủ nhiệm lớp này.
                </p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-[#FAFBF7] border border-dashed border-[#ECEDEC] space-y-1.5">
                <p className="text-xs font-bold text-foreground">Không tìm thấy giáo viên</p>
                <p className="text-[11px] text-muted">
                  Không có giáo viên nào khớp với từ khóa &ldquo;{searchTerm}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="max-h-60 sm:max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-border/70 rounded-2xl p-2 bg-[#FCFDFC]">
                {filteredTeachers.map((teacher) => {
                  const isChecked = selectedTeacherIds.includes(teacher.id);
                  const isCurrentAssistant = (classInfo.assistantTeachers ?? []).some(
                    (at) => at.userId === teacher.id
                  );

                  return (
                    <label
                      key={teacher.id}
                      htmlFor={`teacher-checkbox-${teacher.id}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-[#E8F8F1] border-[#A7E5D2] text-[#1A624C] shadow-2xs"
                          : "bg-card border-border hover:bg-[#FAFBF7] hover:border-brand/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {/* Checkbox */}
                        <input
                          id={`teacher-checkbox-${teacher.id}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggle(teacher.id)}
                          disabled={assignMutation.isPending}
                          className="w-4 h-4 rounded text-brand focus:ring-brand border-gray-300 transition-all cursor-pointer shrink-0"
                        />

                        {/* Avatar chữ cái đầu */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isChecked
                              ? "bg-brand text-white shadow-2xs"
                              : "bg-brand-subtle text-brand border border-brand/20"
                          }`}
                        >
                          {teacher.fullName.charAt(0).toUpperCase()}
                        </div>

                        {/* Họ tên và Email */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold truncate">
                              {teacher.fullName}
                            </span>
                            {isCurrentAssistant && (
                              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-brand-subtle text-brand border border-brand/20">
                                Đang phụ trách
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted truncate block">
                            {teacher.email}
                          </span>
                        </div>
                      </div>

                      {/* Trạng thái tích chọn */}
                      <span className="text-xs font-semibold shrink-0 ml-1">
                        {isChecked ? (
                          <span className="text-[#1A624C] font-bold text-sm">✓</span>
                        ) : (
                          <span className="text-muted/60 text-xs">+ Thêm</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ghi chú khi chọn rỗng */}
          {eligibleTeachers.length > 0 && selectedTeacherIds.length === 0 && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 p-2.5 rounded-xl leading-relaxed">
              💡 <strong>Lưu ý:</strong> Hiện không có giáo viên nào được chọn. Khi bấm &ldquo;Lưu phân công&rdquo;, toàn bộ giáo viên phụ của lớp này sẽ được gỡ bỏ.
            </p>
          )}

          {/* Thông báo lỗi từ server */}
          {serverError && (
            <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <div className="leading-relaxed font-normal">{serverError}</div>
            </div>
          )}

          {/* Các nút thao tác cuối hộp thoại */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={assignMutation.isPending}
              className="px-4 py-2 rounded-full text-xs font-semibold text-muted hover:text-foreground hover:bg-black/5 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={assignMutation.isPending || isLoadingUsers}
              className="px-5 py-2 rounded-full text-xs font-bold text-white bg-brand hover:bg-brand-hover shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
            >
              {assignMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu phân công ({selectedTeacherIds.length})</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
