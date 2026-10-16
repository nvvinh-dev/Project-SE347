"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ClassCard } from "@/components/admin/classes/ClassCard";
import { ClassPlacementTable } from "@/components/admin/classes/ClassPlacementTable";
import { AssignHomeroomTeacherModal } from "@/components/admin/classes/AssignHomeroomTeacherModal";
import { AssignClassModal } from "@/components/admin/classes/AssignClassModal";
import { useClasses, useClassPlacements, useAssignHomeroomTeacher } from "@/hooks/useClasses";
import { toApiError } from "@/lib/axios";
import type { ClassResponse, ClassPlacementResponse } from "@/types/class";

export default function AdminClassesPage() {
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

  const removeTeacherMutation = useAssignHomeroomTeacher();

  // State bộ lọc lớp đang chọn ở bảng
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");

  // State modals
  const [assigningTeacherClass, setAssigningTeacherClass] = useState<ClassResponse | null>(null);
  const [removingTeacherClass, setRemovingTeacherClass] = useState<ClassResponse | null>(null);
  const [assigningChild, setAssigningChild] = useState<ClassPlacementResponse | null>(null);

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

  // Tính toán nhanh số liệu Metric Pills (UI_DESIGN_GUIDELINES.md §7.6.1)
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

  // Xử lý xác nhận gỡ giáo viên chủ nhiệm
  const handleConfirmRemoveTeacher = async () => {
    if (!removingTeacherClass) return;

    try {
      await removeTeacherMutation.mutateAsync({
        classId: removingTeacherClass.id,
        data: {
          teacherUserId: null,
        },
      });

      showToast(`Đã gỡ giáo viên chủ nhiệm của ${removingTeacherClass.name} thành công.`);
      setRemovingTeacherClass(null);
    } catch (err) {
      const apiErr = toApiError(err);
      alert(apiErr.message);
    }
  };

  const isGlobalLoading = isLoadingClasses && isLoadingPlacements;
  const isGlobalError = isErrorClasses || isErrorPlacements;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Page Header & Quick Metric Pills */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Xếp lớp & Phân công"
          description="Quản lý 3 khối lớp theo độ tuổi và phân công giáo viên chủ nhiệm"
        />

        {/* Quick Metric Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <div className="px-3.5 py-1.5 rounded-full bg-card border border-border text-xs flex items-center gap-2 shadow-2xs">
            <span className="text-muted">Tổng số trẻ:</span>
            <span className="font-bold text-foreground">{metrics.total}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-[#E8F8F1] border border-[#A7E5D2]/50 text-xs flex items-center gap-2 shadow-2xs">
            <span className="text-[#1A624C] font-medium">Đã xếp lớp:</span>
            <span className="font-bold text-[#1A624C]">{metrics.assigned}</span>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-2xs transition-all ${
              metrics.unassigned > 0
                ? "bg-[#FBE8E2] border border-[#FAC4CD] text-[#8A4F42]"
                : "bg-card border border-border text-muted"
            }`}
          >
            <span>{metrics.unassigned > 0 ? "⚠️" : "✓"}</span>
            <span className="font-medium">Chờ xếp lớp:</span>
            <span className="font-bold">{metrics.unassigned}</span>
          </div>
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
            className="p-1 rounded-full hover:bg-black/5 text-[#1A624C] transition-all"
            aria-label="Đóng thông báo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Thông báo lỗi khi tải dữ liệu */}
      {isGlobalError && (
        <div className="p-4 rounded-2xl bg-danger-bg border border-danger-border text-xs text-danger flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>
              {errorClasses ? toApiError(errorClasses).message : toApiError(errorPlacements).message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              refetchClasses();
              refetchPlacements();
            }}
            className="px-3 py-1 rounded-full font-semibold bg-danger text-white hover:bg-danger-hover transition-all"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 2. Three Class Cards Grid (UI_DESIGN_GUIDELINES.md §7.6.2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isGlobalLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-card border border-border animate-pulse space-y-4"
              >
                <div className="h-6 w-36 bg-black/5 rounded-full" />
                <div className="h-8 w-28 bg-black/5 rounded" />
                <div className="h-12 w-full bg-black/5 rounded-2xl" />
                <div className="h-8 w-full bg-black/5 rounded-full" />
              </div>
            ))
          : classes.map((cls) => {
              const studentCount = placements.filter((p) => p.classId === cls.id).length;
              const isSelected = selectedClassFilter === cls.name;

              return (
                <ClassCard
                  key={cls.id}
                  classInfo={cls}
                  studentCount={studentCount}
                  isSelected={isSelected}
                  onSelect={() => setSelectedClassFilter(cls.name)}
                  onAssignTeacher={() => setAssigningTeacherClass(cls)}
                  onRemoveTeacher={() => setRemovingTeacherClass(cls)}
                />
              );
            })}
      </div>

      {/* 3. Students Placement Table (UI_DESIGN_GUIDELINES.md §7.6.3) */}
      <ClassPlacementTable
        placements={placements}
        selectedClassFilter={selectedClassFilter}
        onFilterChange={setSelectedClassFilter}
        onOpenAssignModal={(child) => setAssigningChild(child)}
        isLoading={isLoadingPlacements}
      />

      {/* 4. Modal Phân công / Đổi Giáo viên Chủ nhiệm */}
      {assigningTeacherClass && (
        <AssignHomeroomTeacherModal
          key={assigningTeacherClass.id}
          classInfo={assigningTeacherClass}
          isOpen={assigningTeacherClass !== null}
          onClose={() => setAssigningTeacherClass(null)}
          onSuccess={showToast}
        />
      )}

      {/* 5. Modal Xếp trẻ vào lớp / Chuyển lớp */}
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

      {/* 6. Hộp thoại xác nhận Gỡ Giáo viên Chủ nhiệm */}
      <ConfirmDialog
        isOpen={removingTeacherClass !== null}
        title="Gỡ giáo viên chủ nhiệm"
        variant="destructive"
        confirmText="Xác nhận gỡ"
        cancelText="Hủy bỏ"
        isLoading={removeTeacherMutation.isPending}
        onClose={() => {
          if (!removeTeacherMutation.isPending) setRemovingTeacherClass(null);
        }}
        onConfirm={handleConfirmRemoveTeacher}
        description={
          removingTeacherClass ? (
            <div className="space-y-2">
              <p>
                Bạn có chắc chắn muốn gỡ giáo viên{" "}
                <strong className="text-foreground">
                  {removingTeacherClass.homeroomTeacher?.fullName}
                </strong>{" "}
                khỏi vị trí chủ nhiệm của{" "}
                <strong className="text-foreground">{removingTeacherClass.name}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-xs text-danger">
                Sau khi gỡ, lớp sẽ ở trạng thái chưa có giáo viên chủ nhiệm cho đến khi được phân công lại.
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}
