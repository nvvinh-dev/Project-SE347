"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ClassCard } from "@/components/admin/classes/ClassCard";
import { ClassPlacementTable } from "@/components/admin/classes/ClassPlacementTable";
import { AssignHomeroomTeacherModal } from "@/components/admin/classes/AssignHomeroomTeacherModal";
import { AssignAssistantTeachersModal } from "@/components/admin/classes/AssignAssistantTeachersModal";
import { AssignClassModal } from "@/components/admin/classes/AssignClassModal";
import { SaveClassModal } from "@/components/admin/classes/SaveClassModal";
import {
  useGradeLevels,
  useClasses,
  useClassPlacements,
  useAssignHomeroomTeacher,
  useArchiveClass,
} from "@/hooks/useClasses";
import { useUsers } from "@/hooks/useUsers";
import { getGradeLevelTheme } from "@/lib/classAge";
import { toApiError } from "@/lib/axios";
import type { ClassPlacementResponse, ClassResponse } from "@/types/class";

type SaveModalState =
  | { mode: "create"; defaultGradeLevelId?: number }
  | { mode: "edit"; classId: string }
  | null;

export default function AdminClassesPage() {
  const {
    data: gradeLevels = [],
    isLoading: isLoadingGradeLevels,
    isError: isErrorGradeLevels,
    error: errorGradeLevels,
    refetch: refetchGradeLevels,
  } = useGradeLevels();

  const {
    data: classes = [],
    isLoading: isLoadingClasses,
    isError: isErrorClasses,
    error: errorClasses,
    refetch: refetchClasses,
  } = useClasses();

  const {
    data: placements = [],
    isLoading: isLoadingPlacements,
    isError: isErrorPlacements,
    error: errorPlacements,
    refetch: refetchPlacements,
  } = useClassPlacements();

  const { data: users = [] } = useUsers();

  // Bản đồ tài khoản người dùng không hợp lệ (vô hiệu hóa hoặc không còn vai trò Giáo viên)
  // để hiển thị cảnh báo đồng bộ trên thẻ lớp
  const invalidTeacherMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      if (!u.isActive) {
        map.set(u.id, "Đã vô hiệu hóa");
      } else if (u.role !== "Teacher") {
        map.set(u.id, "Không còn là giáo viên");
      }
    }
    return map;
  }, [users]);

  const removeTeacherMutation = useAssignHomeroomTeacher();
  const archiveClassMutation = useArchiveClass();

  // State bộ lọc lớp đang chọn ở bảng và trang hiện tại
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Quản lý trạng thái các hộp thoại bằng ID để luôn lấy dữ liệu mới nhất khi refetch
  const [saveModalState, setSaveModalState] = useState<SaveModalState>(null);
  const [archivingClassId, setArchivingClassId] = useState<string | null>(null);
  const [archiveClassError, setArchiveClassError] = useState<string | null>(null);
  const [assigningTeacherClassId, setAssigningTeacherClassId] = useState<string | null>(null);
  const [assigningAssistantClassId, setAssigningAssistantClassId] = useState<string | null>(null);
  const [removingTeacherClassId, setRemovingTeacherClassId] = useState<string | null>(null);
  const [removeTeacherError, setRemoveTeacherError] = useState<string | null>(null);
  const [assigningChild, setAssigningChild] = useState<ClassPlacementResponse | null>(null);

  // Lấy dữ liệu lớp mới nhất tương ứng với ID đang mở modal
  const editingClass = useMemo(
    () =>
      saveModalState?.mode === "edit"
        ? (classes.find((c) => c.id === saveModalState.classId) ?? null)
        : null,
    [classes, saveModalState]
  );
  const archivingClass = useMemo(
    () => classes.find((c) => c.id === archivingClassId) ?? null,
    [classes, archivingClassId]
  );
  const assigningTeacherClass = useMemo(
    () => classes.find((c) => c.id === assigningTeacherClassId) ?? null,
    [classes, assigningTeacherClassId]
  );
  const assigningAssistantClass = useMemo(
    () => classes.find((c) => c.id === assigningAssistantClassId) ?? null,
    [classes, assigningAssistantClassId]
  );
  const removingTeacherClass = useMemo(
    () => classes.find((c) => c.id === removingTeacherClassId) ?? null,
    [classes, removingTeacherClassId]
  );

  // State thông báo thành công (Toast notification)
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setSuccessToast(message);
    toastTimerRef.current = setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Tính toán nhanh các chỉ số thống kê
  const metrics = useMemo(() => {
    const totalChildren = placements.length;
    const assignedChildren = placements.filter((p) => p.classId !== null).length;
    const unassignedChildren = totalChildren - assignedChildren;

    return {
      total: totalChildren,
      assigned: assignedChildren,
      unassigned: unassignedChildren,
    };
  }, [placements]);

  // Nhóm các lớp đang hoạt động theo 3 khối cố định (giữ thứ tự sort_order từ backend)
  const studentCountByClassId = useMemo(() => {
    const map = new Map<string, number>();
    if (isLoadingPlacements || isErrorPlacements) return map;
    for (const placement of placements) {
      if (placement.classId) {
        map.set(placement.classId, (map.get(placement.classId) ?? 0) + 1);
      }
    }
    return map;
  }, [placements, isLoadingPlacements, isErrorPlacements]);

  // Thống nhất một nguồn đếm số trẻ: khi danh sách trẻ đã tải xong dùng số liệu thực tế từ bảng (kể cả 0),
  // chỉ dùng childCount của GET /api/classes khi placements đang tải hoặc lỗi
  const getChildCount = useCallback(
    (cls: ClassResponse): number => {
      if (isLoadingPlacements || isErrorPlacements) {
        return cls.childCount;
      }
      return studentCountByClassId.get(cls.id) ?? 0;
    },
    [isLoadingPlacements, isErrorPlacements, studentCountByClassId]
  );

  const classesByGradeLevel = useMemo(() => {
    return gradeLevels.map((gradeLevel) => {
      const groupClasses = classes.filter((c) => c.gradeLevel.id === gradeLevel.id);
      const totalChildrenInGrade = groupClasses.reduce(
        (sum, cls) => sum + getChildCount(cls),
        0
      );
      return {
        gradeLevel,
        classes: groupClasses,
        totalChildren: totalChildrenInGrade,
      };
    });
  }, [gradeLevels, classes, getChildCount]);

  // Xử lý xác nhận gỡ giáo viên chủ nhiệm
  const handleConfirmRemoveTeacher = async () => {
    if (!removingTeacherClass) return;
    setRemoveTeacherError(null);

    try {
      await removeTeacherMutation.mutateAsync({
        classId: removingTeacherClass.id,
        data: {
          teacherUserId: null,
        },
      });

      showToast(`Đã gỡ giáo viên chủ nhiệm của ${removingTeacherClass.name} thành công.`);
      setRemovingTeacherClassId(null);
      setRemoveTeacherError(null);
    } catch (err) {
      const apiErr = toApiError(err);
      setRemoveTeacherError(apiErr.message);
    }
  };

  // Xử lý xác nhận lưu trữ lớp học (một chiều)
  const handleConfirmArchiveClass = async () => {
    if (!archivingClass) return;
    setArchiveClassError(null);
    const archivedGradeLevelId = archivingClass.gradeLevel.id;

    try {
      await archiveClassMutation.mutateAsync({ classId: archivingClass.id });
      if (selectedClassFilter === archivingClass.id) {
        setSelectedClassFilter("ALL");
        setCurrentPage(1);
      }
      showToast(`Đã lưu trữ lớp "${archivingClass.name}" thành công.`);
      setArchivingClassId(null);
      setArchiveClassError(null);

      // Thẻ lớp vừa bị ẩn khỏi DOM nên đưa focus về tiêu đề khối tương ứng cho người dùng bàn phím
      requestAnimationFrame(() => {
        document.getElementById(`grade-level-heading-${archivedGradeLevelId}`)?.focus();
      });
    } catch (err) {
      setArchiveClassError(toApiError(err).message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Tiêu đề trang, các chỉ số nhanh và nút tạo lớp mới */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 min-w-0 max-w-full">
        <PageHeader
          title="Xếp lớp & Phân công"
          description="Quản lý lớp học theo 3 khối cố định, phân công giáo viên và xếp lớp cho trẻ"
        />

        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <div className="px-3.5 py-1.5 rounded-full bg-card border border-border text-xs flex items-center gap-2 shadow-2xs">
            <span className="text-muted">Số lớp:</span>
            <span className="font-bold text-foreground">
              {isLoadingClasses || isErrorClasses ? "—" : classes.length}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-card border border-border text-xs flex items-center gap-2 shadow-2xs">
            <span className="text-muted">Tổng số trẻ:</span>
            <span className="font-bold text-foreground">
              {isLoadingPlacements || isErrorPlacements ? "—" : metrics.total}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-[#E8F8F1] border border-[#A7E5D2]/50 text-xs flex items-center gap-2 shadow-2xs">
            <span className="text-[#1A624C] font-medium">Đã xếp lớp:</span>
            <span className="font-bold text-[#1A624C]">
              {isLoadingPlacements || isErrorPlacements ? "—" : metrics.assigned}
            </span>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-2xs transition-all ${
              isLoadingPlacements || isErrorPlacements
                ? "bg-card border border-border text-muted"
                : metrics.unassigned > 0
                  ? "bg-[#FBE8E2] border border-[#FAC4CD] text-[#8A4F42]"
                  : "bg-[#E8F8F1] border border-[#A7E5D2]/50 text-[#1A624C]"
            }`}
          >
            <span>
              {isLoadingPlacements || isErrorPlacements
                ? "⏳"
                : metrics.unassigned > 0
                  ? "⚠️"
                  : "✓"}
            </span>
            <span className="font-medium">Chờ xếp lớp:</span>
            <span className="font-bold">
              {isLoadingPlacements || isErrorPlacements ? "—" : metrics.unassigned}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSaveModalState({ mode: "create" })}
            disabled={isLoadingGradeLevels || gradeLevels.length === 0}
            className="px-4 py-2 rounded-full text-xs font-bold bg-brand hover:bg-brand-hover text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>+ Tạo lớp mới</span>
          </button>
        </div>
      </div>

      {/* Thông báo thành công tự tắt */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-[#E8F8F1] border border-[#A7E5D2] text-xs text-[#1A624C] flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="text-base">✓</span>
            <span className="font-medium">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="p-1 rounded-full hover:bg-black/5 text-[#1A624C] transition-all cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 2. Danh sách lớp học nhóm theo 3 khối cố định (D39 mục 3, FR-CLASS-03) */}
      <div className="space-y-6">
        {isLoadingClasses || isLoadingGradeLevels ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-card border border-border animate-pulse space-y-4"
              >
                <div className="h-6 w-36 bg-black/5 rounded-full" />
                <div className="h-8 w-28 bg-black/5 rounded" />
                <div className="h-12 w-full bg-black/5 rounded-2xl" />
                <div className="h-8 w-full bg-black/5 rounded-full" />
              </div>
            ))}
          </div>
        ) : isErrorClasses || isErrorGradeLevels ? (
          <div className="p-8 rounded-3xl bg-card border border-danger-border text-center space-y-3">
            <p className="text-xs font-semibold text-danger">
              Không thể tải danh sách khối và lớp học:{" "}
              {errorGradeLevels
                ? toApiError(errorGradeLevels).message
                : toApiError(errorClasses).message}
            </p>
            <button
              type="button"
              onClick={() => {
                refetchGradeLevels();
                refetchClasses();
              }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-danger text-white hover:bg-danger-hover transition-all cursor-pointer"
            >
              Thử tải lại
            </button>
          </div>
        ) : (
          classesByGradeLevel.map(({ gradeLevel, classes: groupClasses, totalChildren }) => {
            const theme = getGradeLevelTheme({
              gradeLevelId: gradeLevel.id,
              minAgeMonths: gradeLevel.minAgeMonths,
              maxAgeMonths: gradeLevel.maxAgeMonths,
              name: gradeLevel.name,
            });

            return (
              <section
                key={gradeLevel.id}
                aria-labelledby={`grade-level-heading-${gradeLevel.id}`}
                className={`p-4 sm:p-5 rounded-3xl border ${theme.sectionBorder} ${theme.sectionBg} space-y-4`}
              >
                {/* Tiêu đề từng khối */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                    >
                      <span>{theme.icon}</span>
                      <span
                        id={`grade-level-heading-${gradeLevel.id}`}
                        tabIndex={-1}
                        className="focus:outline-none"
                      >
                        Khối {gradeLevel.name}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-muted">
                      Độ tuổi: {gradeLevel.minAgeMonths} ≤ tuổi &lt; {gradeLevel.maxAgeMonths} tháng
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-card border border-border text-xs font-semibold text-foreground shadow-2xs">
                      {groupClasses.length} lớp · {totalChildren} trẻ
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSaveModalState({
                          mode: "create",
                          defaultGradeLevelId: gradeLevel.id,
                        })
                      }
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-card hover:bg-brand-subtle text-brand border border-border hover:border-brand-subtle transition-all cursor-pointer shadow-2xs"
                    >
                      + Thêm lớp
                    </button>
                  </div>
                </div>

                {/* Lưới thẻ lớp học thuộc khối hoặc trạng thái rỗng */}
                {groupClasses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {groupClasses.map((cls: ClassResponse) => {
                      const studentCount = getChildCount(cls);
                      const isSelected =
                        selectedClassFilter === cls.id || selectedClassFilter === cls.name;

                      return (
                        <ClassCard
                          key={cls.id}
                          classInfo={cls}
                          studentCount={studentCount}
                          isSelected={isSelected}
                          invalidTeacherMap={invalidTeacherMap}
                          onSelect={() => {
                            setSelectedClassFilter(cls.id);
                            setCurrentPage(1);
                          }}
                          onEditClass={() =>
                            setSaveModalState({ mode: "edit", classId: cls.id })
                          }
                          onArchiveClass={() => {
                            setArchiveClassError(null);
                            setArchivingClassId(cls.id);
                          }}
                          onAssignTeacher={() => setAssigningTeacherClassId(cls.id)}
                          onRemoveTeacher={() => {
                            setRemoveTeacherError(null);
                            setRemovingTeacherClassId(cls.id);
                          }}
                          onAssignAssistantTeachers={() =>
                            setAssigningAssistantClassId(cls.id)
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-card/85 border border-dashed border-border text-center space-y-2.5">
                    <p className="text-xs font-medium text-muted">
                      Chưa có lớp học nào đang hoạt động thuộc Khối {gradeLevel.name}.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setSaveModalState({
                          mode: "create",
                          defaultGradeLevelId: gradeLevel.id,
                        })
                      }
                      className="px-4 py-1.5 rounded-full text-xs font-semibold bg-brand text-white hover:bg-brand-hover transition-all cursor-pointer"
                    >
                      Tạo lớp cho Khối {gradeLevel.name}
                    </button>
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>

      {/* 3. Bảng danh sách trẻ cần xếp lớp (D45, AC-CLASS-04) */}
      <ClassPlacementTable
        placements={placements}
        classes={classes}
        selectedClassFilter={selectedClassFilter}
        onFilterChange={(filter) => {
          setSelectedClassFilter(filter);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onOpenAssignModal={(child) => setAssigningChild(child)}
        isLoading={isLoadingPlacements}
        isError={isErrorPlacements}
        error={errorPlacements}
        onRetry={refetchPlacements}
      />

      {/* 4. Modal Phân công / Đổi Giáo viên Chủ nhiệm */}
      {assigningTeacherClass && (
        <AssignHomeroomTeacherModal
          key={assigningTeacherClass.id}
          classInfo={assigningTeacherClass}
          isOpen={assigningTeacherClass !== null}
          onClose={() => setAssigningTeacherClassId(null)}
          onSuccess={showToast}
        />
      )}

      {/* 5. Modal Phân công Giáo viên Phụ (FR-CLASS-02) */}
      {assigningAssistantClass && (
        <AssignAssistantTeachersModal
          key={assigningAssistantClass.id}
          classInfo={assigningAssistantClass}
          isOpen={assigningAssistantClass !== null}
          onClose={() => setAssigningAssistantClassId(null)}
          onSuccess={showToast}
        />
      )}

      {/* 6. Modal Xếp trẻ vào lớp / Chuyển lớp */}
      {assigningChild && (
        <AssignClassModal
          key={assigningChild.childId}
          placement={assigningChild}
          classes={classes}
          isOpen={assigningChild !== null}
          onClose={() => setAssigningChild(null)}
          onSuccess={showToast}
        />
      )}

      {/* 7. Modal Tạo / Chỉnh sửa lớp học (FR-CLASS-03) */}
      {saveModalState && (saveModalState.mode === "create" || editingClass) && (
        <SaveClassModal
          key={
            saveModalState.mode === "edit" && editingClass
              ? `edit-${editingClass.id}`
              : `create-${saveModalState.mode === "create" ? (saveModalState.defaultGradeLevelId ?? "any") : "any"}`
          }
          mode={saveModalState.mode}
          classInfo={saveModalState.mode === "edit" ? editingClass : null}
          gradeLevels={gradeLevels}
          defaultGradeLevelId={
            saveModalState.mode === "create" ? saveModalState.defaultGradeLevelId : undefined
          }
          isOpen
          onClose={() => setSaveModalState(null)}
          onSuccess={showToast}
        />
      )}

      {/* 8. Hộp thoại xác nhận Lưu trữ lớp học (một chiều) */}
      <ConfirmDialog
        isOpen={archivingClass !== null}
        title="Lưu trữ lớp học"
        variant="destructive"
        confirmText="Xác nhận lưu trữ"
        cancelText="Hủy bỏ"
        isLoading={archiveClassMutation.isPending}
        onClose={() => {
          if (!archiveClassMutation.isPending) {
            setArchivingClassId(null);
            setArchiveClassError(null);
          }
        }}
        onConfirm={handleConfirmArchiveClass}
        description={
          archivingClass ? (
            <div className="space-y-3">
              <p>
                Bạn có chắc chắn muốn lưu trữ lớp{" "}
                <strong className="text-foreground">{archivingClass.name}</strong> (Khối{" "}
                {archivingClass.gradeLevel.name})?
              </p>

              {getChildCount(archivingClass) > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900">
                  Lớp hiện đang có <strong>{getChildCount(archivingClass)}</strong> trẻ. Hệ thống
                  chỉ cho phép lưu trữ lớp khi không còn trẻ nào đang theo học.
                </div>
              )}

              <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger">
                Lưu ý: Lưu trữ lớp là thao tác một chiều và không thể mở lại. Sau khi lưu trữ, lớp
                sẽ ẩn khỏi danh sách đang hoạt động và tự động gỡ phân công giáo viên phụ trách
                (ảnh hoạt động cũ vẫn được giữ nguyên).
              </div>

              {archiveClassError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger flex items-start gap-2"
                >
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <div className="leading-relaxed font-normal">{archiveClassError}</div>
                </div>
              )}
            </div>
          ) : null
        }
      />

      {/* 9. Hộp thoại xác nhận Gỡ Giáo viên Chủ nhiệm */}
      <ConfirmDialog
        isOpen={removingTeacherClass !== null}
        title="Gỡ giáo viên chủ nhiệm"
        variant="destructive"
        confirmText="Xác nhận gỡ"
        cancelText="Hủy bỏ"
        isLoading={removeTeacherMutation.isPending}
        onClose={() => {
          if (!removeTeacherMutation.isPending) {
            setRemovingTeacherClassId(null);
            setRemoveTeacherError(null);
          }
        }}
        onConfirm={handleConfirmRemoveTeacher}
        description={
          removingTeacherClass ? (
            <div className="space-y-3">
              <p>
                Bạn có chắc chắn muốn gỡ giáo viên{" "}
                <strong className="text-foreground">
                  {removingTeacherClass.homeroomTeacher?.fullName}
                </strong>{" "}
                khỏi vị trí chủ nhiệm của{" "}
                <strong className="text-foreground">{removingTeacherClass.name}</strong>?
              </p>
              {removeTeacherError ? (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger flex items-start gap-2"
                >
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <div className="leading-relaxed font-normal">{removeTeacherError}</div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger">
                  Sau khi gỡ, lớp sẽ ở trạng thái chưa có giáo viên chủ nhiệm cho đến khi được phân công lại.
                </div>
              )}
            </div>
          ) : null
        }
      />
    </div>
  );
}
