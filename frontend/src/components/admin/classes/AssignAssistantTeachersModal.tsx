"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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

interface FormValues {
  teacherUserIds: string[];
}

interface DisplayTeacher {
  id: string;
  fullName: string;
  email: string;
  isInvalid: boolean;
  invalidReasonLabel?: string;
}

/**
 * Hàm loại bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
 * Ví dụ: "binh" khớp với "Bình"
 */
function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function AssignAssistantTeachersModal({
  classInfo,
  isOpen,
  onClose,
  onSuccess,
}: AssignAssistantTeachersModalProps) {
  // Quản lý form theo React Hook Form (chuẩn D12)
  const { control, setValue, handleSubmit: handleFormSubmit } = useForm<FormValues>({
    defaultValues: {
      teacherUserIds: classInfo?.assistantTeachers?.map((t) => t.userId) ?? [],
    },
  });

  const selectedTeacherIds = useWatch({ control, name: "teacherUserIds" }) ?? [];
  const [searchTerm, setSearchTerm] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const errorAlertRef = useRef<HTMLDivElement>(null);

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

  // Nhận diện các giáo viên phụ hiện tại của lớp mà tài khoản không còn hợp lệ
  // (Đã vô hiệu hóa hoặc không còn giữ vai trò Giáo viên)
  const inactiveAssistantTeachers = useMemo<DisplayTeacher[]>(() => {
    if (!classInfo?.assistantTeachers || classInfo.assistantTeachers.length === 0) return [];
    const activeIds = new Set(activeTeachers.map((t) => t.id));
    const homeroomId = classInfo.homeroomTeacher?.userId;

    return classInfo.assistantTeachers
      .filter((at) => !activeIds.has(at.userId) && at.userId !== homeroomId)
      .map((at) => {
        const matchedUser = users.find((u) => u.id === at.userId);
        let reasonLabel = "Đã vô hiệu hóa";
        let emailNote = "Tài khoản đã bị vô hiệu hóa";

        if (matchedUser && matchedUser.isActive && matchedUser.role !== "Teacher") {
          reasonLabel = "Không còn là giáo viên";
          emailNote = `Đã chuyển sang vai trò ${matchedUser.role}`;
        } else if (!matchedUser) {
          reasonLabel = "Tài khoản không tồn tại";
          emailNote = "Không tìm thấy thông tin tài khoản";
        }

        return {
          id: at.userId,
          fullName: at.fullName || matchedUser?.fullName || "Giáo viên",
          email: matchedUser?.email || emailNote,
          isInvalid: true,
          invalidReasonLabel: reasonLabel,
        };
      });
  }, [classInfo, activeTeachers, users]);

  // Danh sách giáo viên khả dụng: gồm các giáo viên đang active (loại trừ GVCN)
  // và các giáo viên phụ hiện tại không còn hợp lệ (để Admin có thể bỏ chọn gỡ ra)
  const eligibleTeachers = useMemo<DisplayTeacher[]>(() => {
    const homeroomId = classInfo?.homeroomTeacher?.userId;
    const activeNonHomeroom: DisplayTeacher[] = activeTeachers
      .filter((t) => t.id !== homeroomId)
      .map((t) => ({
        id: t.id,
        fullName: t.fullName,
        email: t.email,
        isInvalid: false,
      }));

    // Đưa những người không còn hợp lệ lên đầu danh sách để Admin dễ thấy và xử lý gỡ
    return [...inactiveAssistantTeachers, ...activeNonHomeroom];
  }, [classInfo, activeTeachers, inactiveAssistantTeachers]);

  // Lọc theo từ khóa tìm kiếm (họ tên hoặc email, không phân biệt dấu tiếng Việt)
  const filteredTeachers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return eligibleTeachers;
    const normalizedTerm = removeVietnameseDiacritics(term);

    return eligibleTeachers.filter((t) => {
      const name = t.fullName.toLowerCase();
      const email = t.email.toLowerCase();
      const normalizedName = removeVietnameseDiacritics(t.fullName);

      return (
        name.includes(term) ||
        normalizedName.includes(normalizedTerm) ||
        email.includes(term)
      );
    });
  }, [eligibleTeachers, searchTerm]);

  // Các giáo viên có thể chọn trong danh sách kết quả lọc (loại trừ tài khoản không hợp lệ)
  const selectableFilteredTeachers = useMemo(() => {
    return filteredTeachers.filter((t) => !t.isInvalid);
  }, [filteredTeachers]);

  // Quản lý Focus chuẩn a11y: Bẫy focus và khôi phục khi đóng.
  // Truyền initialFocusRef cố định để không làm effect chạy lại và ghi đè previousActiveElement.
  const { containerRef } = useFocusTrap({
    isOpen,
    isLoading: assignMutation.isPending,
    onClose,
    initialFocusRef: searchInputRef,
  });

  // Khôi phục focus vào khung lỗi khi serverError xuất hiện (chuẩn a11y)
  useEffect(() => {
    if (serverError) {
      errorAlertRef.current?.focus();
    }
  }, [serverError]);

  if (!isOpen || !classInfo) return null;

  const handleToggle = (teacherId: string) => {
    if (assignMutation.isPending) return;
    const targetTeacher = eligibleTeachers.find((t) => t.id === teacherId);
    const isChecked = selectedTeacherIds.includes(teacherId);

    // Nếu tài khoản không còn hợp lệ và đã bị bỏ tick, không cho phép tick lại để tránh lỗi 409
    if (targetTeacher?.isInvalid && !isChecked) {
      return;
    }

    setValue(
      "teacherUserIds",
      isChecked
        ? selectedTeacherIds.filter((id) => id !== teacherId)
        : [...selectedTeacherIds, teacherId],
      { shouldDirty: true }
    );
    setServerError(null);
  };

  // Chọn tất cả giáo viên hợp lệ trong kết quả lọc (bỏ qua tài khoản không hợp lệ)
  const handleSelectAllFiltered = () => {
    if (assignMutation.isPending) return;
    const validFilteredIds = selectableFilteredTeachers.map((t) => t.id);
    setValue(
      "teacherUserIds",
      Array.from(new Set([...selectedTeacherIds, ...validFilteredIds])),
      { shouldDirty: true }
    );
    setServerError(null);
  };

  // Chỉ bỏ chọn những giáo viên trong kết quả lọc hiện tại (tránh xóa nhầm người ngoài bộ lọc)
  const handleDeselectFiltered = () => {
    if (assignMutation.isPending) return;
    const filteredIdSet = new Set(filteredTeachers.map((t) => t.id));
    setValue(
      "teacherUserIds",
      selectedTeacherIds.filter((id) => !filteredIdSet.has(id)),
      { shouldDirty: true }
    );
    setServerError(null);
  };

  const handleDeselectAll = () => {
    if (assignMutation.isPending) return;
    setValue("teacherUserIds", [], { shouldDirty: true });
    setServerError(null);
  };

  const onSubmit = handleFormSubmit(async (data) => {
    setServerError(null);

    try {
      const updatedClass = await assignMutation.mutateAsync({
        classId: classInfo.id,
        data: {
          teacherUserIds: data.teacherUserIds,
        },
      });

      const count = updatedClass.assistantTeachers?.length ?? data.teacherUserIds.length;
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
    }
  });

  const allFilteredSelected =
    selectableFilteredTeachers.length > 0 &&
    selectableFilteredTeachers.every((t) => selectedTeacherIds.includes(t.id));

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
            className="p-2 min-h-[36px] min-w-[36px] rounded-full text-muted hover:text-foreground hover:bg-black/5 transition-all cursor-pointer flex items-center justify-center"
            aria-label="Đóng hộp thoại"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thân biểu mẫu */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label htmlFor="teacher-search-input" className="text-xs font-bold text-foreground block">
                Danh sách giáo viên có thể phân công:
              </label>

              {eligibleTeachers.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={allFilteredSelected ? handleDeselectFiltered : handleSelectAllFiltered}
                    disabled={assignMutation.isPending || selectableFilteredTeachers.length === 0}
                    className="text-xs font-semibold text-brand hover:text-brand-hover hover:underline transition-all cursor-pointer disabled:opacity-50 min-h-[32px] flex items-center"
                  >
                    {allFilteredSelected ? "Bỏ chọn kết quả lọc" : "Chọn tất cả"}
                  </button>
                  {selectedTeacherIds.length > 0 && (
                    <>
                      <span className="text-muted">•</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        disabled={assignMutation.isPending}
                        className="text-xs font-semibold text-muted hover:text-danger hover:underline transition-all cursor-pointer disabled:opacity-50 min-h-[32px] flex items-center"
                      >
                        Bỏ chọn hết ({selectedTeacherIds.length})
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Ô tìm kiếm (Chặn phím Enter submit form ngoài ý muốn) */}
            <div className="relative">
              <input
                id="teacher-search-input"
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                disabled={assignMutation.isPending || isLoadingUsers}
                placeholder="Tìm theo họ tên hoặc email..."
                className="w-full h-10 pl-9 pr-8 rounded-xl border border-input bg-card text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1.5 rounded-full"
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
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-danger-bg border border-danger-border text-xs text-danger flex items-center justify-between gap-3"
              >
                <span>⚠️ {toApiError(errorUsers).message}</span>
                <button
                  type="button"
                  onClick={() => refetchUsers()}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-danger text-white hover:bg-danger-hover transition-all shrink-0 cursor-pointer min-h-[32px]"
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
                  const isInvalid = teacher.isInvalid;

                  return (
                    <label
                      key={teacher.id}
                      htmlFor={`teacher-checkbox-${teacher.id}`}
                      onClick={(e) => {
                        if (isInvalid && !isChecked) {
                          e.preventDefault();
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border min-h-[48px] select-none gap-2 transition-all ${
                        isChecked
                          ? isInvalid
                            ? "bg-amber-50/70 border-amber-300 text-amber-950 shadow-2xs cursor-pointer"
                            : "bg-[#EAF7FC]/60 border-[#71C8E4]/60 text-foreground shadow-2xs cursor-pointer"
                          : isInvalid
                          ? "bg-muted/10 border-border/60 opacity-60 cursor-not-allowed text-muted"
                          : "bg-card border-border/80 hover:border-brand/40 hover:bg-brand-subtle/30 text-foreground cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Checkbox */}
                        <input
                          id={`teacher-checkbox-${teacher.id}`}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggle(teacher.id)}
                          disabled={assignMutation.isPending || (isInvalid && !isChecked)}
                          className={`w-4 h-4 rounded text-brand focus:ring-brand border-gray-300 transition-all shrink-0 ${
                            isInvalid && !isChecked ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                          }`}
                        />

                        {/* Avatar chữ cái đầu */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isInvalid
                              ? "bg-danger-bg text-danger border border-danger-border"
                              : isChecked
                              ? "bg-[#EAF7FC] text-[#17627D] border border-[#71C8E4]"
                              : "bg-[#EAF7FC] text-[#17627D] border border-[#D5E3F2]"
                          }`}
                        >
                          {teacher.fullName.charAt(0).toUpperCase()}
                        </div>

                        {/* Họ tên và Email */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold truncate max-w-[150px]">
                              {teacher.fullName}
                            </span>
                            {isInvalid && (
                              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-danger-bg text-danger border border-danger-border whitespace-nowrap shrink-0">
                                {teacher.invalidReasonLabel || "Đã vô hiệu hóa"}
                              </span>
                            )}
                            {isCurrentAssistant && !isInvalid && (
                              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-subtle text-brand border border-brand/20 whitespace-nowrap shrink-0">
                                Đang phụ trách
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted truncate block">
                            {teacher.email}
                          </span>
                          {isInvalid && isChecked && (
                            <span className="text-[10px] text-amber-700 block mt-0.5 font-medium leading-tight">
                              Bỏ tick để gỡ khỏi lớp
                            </span>
                          )}
                          {isInvalid && !isChecked && (
                            <span className="text-[10px] text-muted italic block mt-0.5 leading-tight">
                              Không thể phân công lại tài khoản này
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Trạng thái tích chọn */}
                      <span className="text-xs font-semibold shrink-0 ml-2">
                        {isChecked ? (
                          <span className="text-[#1A624C] font-bold text-sm">✓</span>
                        ) : isInvalid ? (
                          <span className="text-muted text-[10px] italic">Đã gỡ</span>
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

          {/* Thông báo lỗi từ server có role="alert" và ref để khôi phục focus */}
          {serverError && (
            <div
              ref={errorAlertRef}
              tabIndex={-1}
              role="alert"
              className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger flex items-start gap-2 outline-none focus:ring-2 focus:ring-danger/40"
            >
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
              className="px-4 py-2 min-h-[38px] rounded-full text-xs font-semibold text-muted hover:text-foreground hover:bg-black/5 transition-all cursor-pointer flex items-center justify-center"
            >
              Hủy bỏ
            </button>
            <button
              ref={submitBtnRef}
              type="submit"
              disabled={assignMutation.isPending || isLoadingUsers || isErrorUsers}
              className="px-5 py-2 min-h-[38px] rounded-full text-xs font-bold text-white bg-brand hover:bg-brand-hover shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
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
