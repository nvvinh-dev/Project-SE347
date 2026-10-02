"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ATTENDANCE_STATUS_LABELS, type AttendanceStatus, type StudentAttendanceItem } from "@/types/attendance";
import { INITIAL_MOCK_STUDENTS, checkInStudent } from "@/lib/attendance";
import { toApiError } from "@/lib/axios";

export default function AttendancePage() {
  const [students, setStudents] = useState<StudentAttendanceItem[]>(INITIAL_MOCK_STUDENTS);
  const [searchQuery, setSearchQuery] = useState("");
  type FilterKey = "ALL" | "UNCHECKED" | AttendanceStatus | "HEALTH_NOTE";
  const [filterStatus, setFilterStatus] = useState<FilterKey>("ALL");

  // Modal xác nhận trước khi điểm danh để tránh bấm nhầm
  const [pendingCheckIn, setPendingCheckIn] = useState<{
    student: StudentAttendanceItem;
    status: AttendanceStatus;
  } | null>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Tự động đóng thông báo sau 3.5 giây với thành công hoặc 6 giây với lỗi
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => {
      setFeedbackMessage(null);
    }, feedbackMessage.type === "success" ? 3500 : 6000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  // Dropdown bộ lọc trạng thái điểm danh
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const todayFormatted = useMemo(() => {
    const now = new Date();
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const dayName = days[now.getDay()];
    const date = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${dayName}, ngày ${date}/${month}/${year}`;
  }, []);

  const studentsWithHealthNotes = useMemo(() => {
    return students.filter((s) => Boolean(s.healthNotes));
  }, [students]);

  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.status === "Present").length;
    const absentExcused = students.filter((s) => s.status === "AbsentExcused").length;
    const absentUnexcused = students.filter((s) => s.status === "AbsentUnexcused").length;
    const unchecked = students.filter((s) => s.status === null).length;
    const checked = total - unchecked;
    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    const healthNoteCount = studentsWithHealthNotes.length;

    return { total, present, absentExcused, absentUnexcused, unchecked, percent, healthNoteCount };
  }, [students, studentsWithHealthNotes]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchName = s.fullName.toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!matchName) return false;

      if (filterStatus === "ALL") return true;
      if (filterStatus === "UNCHECKED") return s.status === null;
      if (filterStatus === "HEALTH_NOTE") return Boolean(s.healthNotes);
      return s.status === filterStatus;
    });
  }, [students, searchQuery, filterStatus]);

  interface FilterOptionItem {
    key: FilterKey;
    label: string;
    count: number;
    dotColor: string;
  }

  interface FilterGroupItem {
    groupLabel: string;
    options: FilterOptionItem[];
  }

  // Cấu hình các nhóm tùy chọn bộ lọc trực quan
  const filterGroups: FilterGroupItem[] = useMemo(() => [
    {
      groupLabel: "Trạng thái điểm danh",
      options: [
        { key: "ALL", label: "Tất cả", count: stats.total, dotColor: "bg-muted" },
        { key: "UNCHECKED", label: "Chưa điểm danh", count: stats.unchecked, dotColor: "bg-muted-light" },
        { key: "Present", label: "Có mặt", count: stats.present, dotColor: "bg-success" },
        { key: "AbsentExcused", label: "Vắng có phép", count: stats.absentExcused, dotColor: "bg-warning" },
        { key: "AbsentUnexcused", label: "Vắng không phép", count: stats.absentUnexcused, dotColor: "bg-danger" },
      ],
    },
    {
      groupLabel: "Lưu ý quan trọng",
      options: [
        { key: "HEALTH_NOTE", label: "Có lưu ý sức khỏe", count: stats.healthNoteCount, dotColor: "bg-success" },
      ],
    },
  ], [stats]);

  const allFilterOptions: FilterOptionItem[] = useMemo(() => {
    return filterGroups.reduce<FilterOptionItem[]>((acc, group) => acc.concat(group.options), []);
  }, [filterGroups]);

  const currentFilterOption: FilterOptionItem = useMemo(() => {
    return allFilterOptions.find((opt) => opt.key === filterStatus) || allFilterOptions[0];
  }, [allFilterOptions, filterStatus]);

  // Quản lý ghi nhận điểm danh qua TanStack Query Mutation
  const checkInMutation = useMutation({
    mutationFn: async ({
      student,
      status,
    }: {
      student: StudentAttendanceItem;
      status: AttendanceStatus;
    }) => {
      return await checkInStudent(student.childId, status);
    },
    onSuccess: (_, variables) => {
      const currentTime = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setStudents((prev) =>
        prev.map((s) =>
          s.childId === variables.student.childId
            ? {
                ...s,
                status: variables.status,
                attendanceId: `att-${Date.now()}`,
                checkInTime: currentTime,
              }
            : s
        )
      );

      setFeedbackMessage({
        type: "success",
        text: `Đã ghi nhận điểm danh: ${variables.student.fullName} — ${ATTENDANCE_STATUS_LABELS[variables.status]}.`,
      });
      setPendingCheckIn(null);
    },
    onError: (err: unknown) => {
      const apiErr = toApiError(err);
      setFeedbackMessage({
        type: "error",
        text: apiErr.message,
      });
      setPendingCheckIn(null);
    },
  });

  const handleRequestCheckIn = (student: StudentAttendanceItem, status: AttendanceStatus) => {
    if (student.status !== null) {
      setFeedbackMessage({
        type: "error",
        text: `Học sinh ${student.fullName} đã được điểm danh hôm nay. Bản ghi đã chốt không thể sửa đổi theo quy định.`,
      });
      return;
    }
    setPendingCheckIn({ student, status });
  };

  const handleConfirmCheckIn = () => {
    if (!pendingCheckIn) return;
    setFeedbackMessage(null);
    checkInMutation.mutate(pendingCheckIn);
  };

  const isSubmitting = checkInMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh vào lớp"
        description="Ghi nhận trạng thái đến lớp hàng ngày của học sinh lớp chủ nhiệm"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-subtle px-3 py-1.5 text-xs font-semibold text-brand-text shadow-2xs">
            <svg className="h-3.5 w-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Lớp Mầm 1</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-2xs">
            <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{todayFormatted}</span>
          </div>

          <Link
            href="/teacher/attendance-history"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted-surface px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground transition-colors shadow-2xs"
          >
            <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Lịch sử</span>
          </Link>
        </div>
      </PageHeader>

      {feedbackMessage && (
        <div
          className={`flex items-start justify-between rounded-xl border p-4 text-sm shadow-xs transition-all ${
            feedbackMessage.type === "success"
              ? "border-success-border bg-success-bg text-success"
              : "border-danger-border bg-danger-bg text-danger"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === "success" ? (
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-current opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Đóng thông báo"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Phần Tổng quan: 5 Thẻ chỉ số thống kê */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-medium text-muted">Sĩ số lớp</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{stats.total}</span>
            <span className="text-xs text-muted">học sinh</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Có mặt</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-success" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-success">{stats.present}</span>
            <span className="text-xs text-muted">bé</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Vắng có phép</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-warning" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-warning">{stats.absentExcused}</span>
            <span className="text-xs text-muted">bé</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Vắng không phép</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-danger" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-danger">{stats.absentUnexcused}</span>
            <span className="text-xs text-muted">bé</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Chưa điểm danh</span>
            <span className="text-xs font-semibold text-brand-text">{stats.percent}%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{stats.unchecked}</span>
            <span className="text-xs text-muted">bé</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted-surface">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* BỐ CỤC 2 CỘT: Cột Trái (Bảng điểm danh) & Cột Phải (Widget Lưu ý sức khỏe & Lời dặn) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Bảng điểm danh học sinh chi tiết (~68% chiều rộng desktop) */}
        <div className="xl:col-span-8 rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 sm:gap-4">
            {/* Thanh tìm kiếm học sinh - luôn canh lề trái và co giãn linh hoạt */}
            <div className="relative flex-1 min-w-0">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
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
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo họ tên học sinh..."
                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-hidden transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground rounded-md transition-colors cursor-pointer"
                  title="Xóa từ khóa tìm kiếm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Bộ lọc Dropdown - luôn canh lề phải */}
            <div className="relative shrink-0" ref={filterDropdownRef}>
              <div className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors shadow-2xs cursor-pointer ${
                    filterStatus !== "ALL"
                      ? "border-brand-border bg-brand-subtle text-brand-text font-semibold"
                      : "border-border bg-card text-foreground hover:bg-muted-surface"
                  }`}
                  aria-expanded={isFilterDropdownOpen}
                  aria-haspopup="true"
                  title="Lọc danh sách học sinh theo trạng thái hoặc lưu ý đặc biệt"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <svg
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-colors ${
                        filterStatus !== "ALL" ? "text-brand" : "text-muted"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    {filterStatus !== "ALL" && (
                      <span className={`h-2 w-2 rounded-full shrink-0 ${currentFilterOption.dotColor}`} />
                    )}
                    <span className="whitespace-nowrap">
                      {currentFilterOption.label} ({currentFilterOption.count})
                    </span>
                  </div>
                  <svg
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted transition-transform duration-200 ${
                      isFilterDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {filterStatus !== "ALL" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterStatus("ALL");
                      }}
                      className="ml-0.5 -mr-1 p-0.5 text-brand-text hover:text-danger rounded-full transition-colors cursor-pointer"
                      title="Bỏ lọc, xem tất cả học sinh"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </button>
              </div>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-border bg-card p-1.5 shadow-lg z-30 animate-in fade-in zoom-in-95 duration-150">
                  {filterGroups.map((group, groupIndex) => (
                    <div key={group.groupLabel} className={groupIndex > 0 ? "mt-2 pt-1.5 border-t border-border/70" : ""}>
                      <div className="px-2.5 py-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        {group.groupLabel}
                      </div>
                      <div className="space-y-0.5 mt-0.5">
                        {group.options.map((opt) => {
                          const isSelected = filterStatus === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setFilterStatus(opt.key);
                                setIsFilterDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-brand-subtle text-brand-text font-semibold"
                                  : "text-foreground hover:bg-muted-surface font-medium"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotColor}`} />
                                <span>{opt.label}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                                    isSelected
                                      ? "bg-brand/20 text-brand-text font-bold"
                                      : "bg-muted-surface text-muted"
                                  }`}
                                >
                                  {opt.count}
                                </span>
                                {isSelected && (
                                  <svg className="h-3.5 w-3.5 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-3">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground">Không tìm thấy học sinh</h3>
              <p className="mt-1 text-xs text-muted">
                {searchQuery
                  ? "Không có học sinh nào khớp với từ khóa tìm kiếm hiện tại."
                  : "Không có học sinh nào thuộc danh mục đã chọn."}
              </p>
              {(filterStatus !== "ALL" || searchQuery) && (
                <div className="mt-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus("ALL");
                      setSearchQuery("");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border bg-brand-subtle text-brand-text text-xs font-semibold hover:bg-brand/15 transition-colors cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Xem tất cả học sinh</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted-surface text-xs font-semibold text-muted">
                      <th className="py-3.5 px-3 w-10 text-center">STT</th>
                      <th className="py-3.5 px-3 min-w-[200px]">Họ và tên học sinh</th>
                      <th className="py-3.5 px-3 w-28">Ngày sinh</th>
                      <th className="py-3.5 px-3 w-20">Giới tính</th>
                      {/* Cột Hợp nhất: Trạng thái & Ghi nhận điểm danh */}
                      <th className="py-3.5 px-3 min-w-[280px]">Trạng thái & Điểm danh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredStudents.map((student, idx) => {
                      const isChecked = student.status !== null;
                      const hasHealthNote = Boolean(student.healthNotes);

                      return (
                        <tr
                          key={student.childId}
                          className={`hover:bg-muted-surface/40 transition-colors ${
                            isChecked ? "bg-muted-surface/20" : ""
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center text-xs text-muted font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold text-xs transition-colors ${
                                  hasHealthNote
                                    ? "bg-success-bg text-success border border-success-border"
                                    : "bg-brand-subtle text-brand"
                                }`}
                              >
                                {student.fullName.charAt(student.fullName.lastIndexOf(" ") + 1) || "T"}
                              </div>
                              <div>
                                <span
                                  title={hasHealthNote ? `Lưu ý y tế: ${student.healthNotes}` : undefined}
                                  className={`font-bold text-sm transition-colors ${
                                    hasHealthNote ? "text-success hover:underline cursor-help" : "text-foreground"
                                  }`}
                                >
                                  {student.fullName}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-xs text-muted">{student.dateOfBirth}</td>
                          <td className="py-3.5 px-3 text-xs text-muted">{student.gender}</td>

                          {/* Cột Hợp nhất: Trạng thái & Điểm danh */}
                          <td className="py-3.5 px-3">
                            {isChecked ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                {student.status === "Present" && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-success-border bg-success-bg px-2 py-0.5 text-xs font-semibold text-success shadow-2xs">
                                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                    Có mặt
                                  </span>
                                )}
                                {student.status === "AbsentExcused" && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-warning-border bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning shadow-2xs">
                                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                                    Vắng có phép
                                  </span>
                                )}
                                {student.status === "AbsentUnexcused" && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-danger-border bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger shadow-2xs">
                                    <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                                    Vắng không phép
                                  </span>
                                )}

                                <span className="text-xs text-muted">
                                  ({student.checkInTime})
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleRequestCheckIn(student, "Present")}
                                  className="inline-flex items-center gap-1 rounded-lg border border-success-border bg-success-bg px-2.5 py-1 text-xs font-medium text-success hover:brightness-95 active:scale-95 disabled:opacity-50 transition-all shadow-2xs"
                                >
                                  Có mặt
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleRequestCheckIn(student, "AbsentExcused")}
                                  className="inline-flex items-center gap-1 rounded-lg border border-warning-border bg-warning-bg px-2 py-1 text-xs font-medium text-warning hover:brightness-95 active:scale-95 disabled:opacity-50 transition-all shadow-2xs"
                                >
                                  Có phép
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleRequestCheckIn(student, "AbsentUnexcused")}
                                  className="inline-flex items-center gap-1 rounded-lg border border-danger-border bg-danger-bg px-2 py-1 text-xs font-medium text-danger hover:brightness-95 active:scale-95 disabled:opacity-50 transition-all shadow-2xs"
                                >
                                  Không phép
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Giao diện Mobile Cards */}
              <div className="sm:hidden divide-y divide-border">
                {filteredStudents.map((student) => {
                  const isChecked = student.status !== null;
                  const hasHealthNote = Boolean(student.healthNotes);

                  return (
                    <div key={student.childId} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold text-xs transition-colors ${
                              hasHealthNote
                                ? "bg-success-bg text-success border border-success-border"
                                : "bg-brand-subtle text-brand"
                            }`}
                          >
                            {student.fullName.charAt(student.fullName.lastIndexOf(" ") + 1) || "T"}
                          </div>
                          <div>
                            <p
                              title={hasHealthNote ? `Lưu ý y tế: ${student.healthNotes}` : undefined}
                              className={`font-bold text-sm ${
                                hasHealthNote ? "text-success" : "text-foreground"
                              }`}
                            >
                              {student.fullName}
                            </p>
                            <p className="text-xs text-muted">
                              {student.dateOfBirth} • {student.gender}
                            </p>
                          </div>
                        </div>

                        {isChecked ? (
                          <div className="text-right">
                            {student.status === "Present" && (
                              <span className="inline-flex items-center rounded-md border border-success-border bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
                                Có mặt
                              </span>
                            )}
                            {student.status === "AbsentExcused" && (
                              <span className="inline-flex items-center rounded-md border border-warning-border bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
                                Vắng có phép
                              </span>
                            )}
                            {student.status === "AbsentUnexcused" && (
                              <span className="inline-flex items-center rounded-md border border-danger-border bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger">
                                Vắng không phép
                              </span>
                            )}
                            <p className="text-xs text-muted mt-0.5">{student.checkInTime}</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-border bg-muted-surface px-2 py-0.5 text-xs font-medium text-muted">
                            Chưa điểm danh
                          </span>
                        )}
                      </div>

                      {/* Thao tác điểm danh nếu chưa điểm danh */}
                      {!isChecked && (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleRequestCheckIn(student, "Present")}
                            className="rounded-lg border border-success-border bg-success-bg py-2 text-xs font-medium text-success active:scale-95 disabled:opacity-50 transition-all text-center"
                          >
                            Có mặt
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleRequestCheckIn(student, "AbsentExcused")}
                            className="rounded-lg border border-warning-border bg-warning-bg py-2 text-xs font-medium text-warning active:scale-95 disabled:opacity-50 transition-all text-center"
                          >
                            Có phép
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleRequestCheckIn(student, "AbsentUnexcused")}
                            className="rounded-lg border border-danger-border bg-danger-bg py-2 text-xs font-medium text-danger active:scale-95 disabled:opacity-50 transition-all text-center"
                          >
                            Không phép
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Ghi chú chân bảng: Nhận diện học sinh có lưu ý sức khỏe */}
          <div className="border-t border-border bg-muted-surface/40 px-4 py-2.5 sm:px-5 text-xs text-muted">
            <p>
              <strong className="text-foreground font-semibold">Ghi chú:</strong> Những học sinh có tên hiển thị màu xanh lá là các bé có lưu ý đặc biệt về sức khỏe (dị ứng, bệnh nền...) từ bộ phận Y tế cần giáo viên lưu ý hơn trong suốt ngày học.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: Widget Lưu ý sức khỏe & Lời dặn phụ huynh (Ghim Sticky ~32% chiều rộng desktop) */}
        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          {/* Widget 1: Lưu ý sức khỏe học sinh cần chú ý trong ngày (FR-HEALTH-07) */}
          <div className="rounded-xl border border-warning-border bg-warning-bg p-4 sm:p-5 shadow-xs">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-warning-border/60">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card text-warning shadow-2xs border border-warning-border">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Lưu ý sức khỏe học sinh
                  </h3>
                  <span className="text-[11px] text-muted">Dặn dò dị ứng & bệnh nền của trẻ</span>
                </div>
              </div>

              <span className="rounded-full bg-warning/20 border border-warning/30 px-2 py-0.5 text-[11px] font-bold text-warning">
                {studentsWithHealthNotes.length} bé
              </span>
            </div>

            <div className="mt-3.5 space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
              {studentsWithHealthNotes.map((student) => (
                <div
                  key={student.childId}
                  className="rounded-xl border border-warning-border/80 bg-card p-3 shadow-2xs hover:border-warning transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand font-bold text-[11px]">
                        {student.fullName.charAt(student.fullName.lastIndexOf(" ") + 1) || "T"}
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        {student.fullName}
                      </h4>
                    </div>

                    {student.status === "Present" ? (
                      <span className="rounded-full bg-success-bg border border-success-border px-1.5 py-0.5 text-[10px] font-semibold text-success leading-none">
                        Có mặt
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted-surface border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted leading-none">
                        Chưa đến
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {student.healthNotes}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-warning-border/60 flex items-center justify-end">
              <Link
                href="/teacher/class-children"
                className="inline-flex items-center gap-1 text-xs font-semibold text-warning hover:underline"
              >
                <span>Xem lưu ý sức khỏe lớp</span>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal xác nhận điểm danh (Chống bấm nhầm chốt khóa vĩnh viễn) */}
      {pendingCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${
                  pendingCheckIn.status === "Present"
                    ? "border-success-border bg-success-bg text-success"
                    : pendingCheckIn.status === "AbsentExcused"
                    ? "border-warning-border bg-warning-bg text-warning"
                    : "border-danger-border bg-danger-bg text-danger"
                }`}
              >
                {pendingCheckIn.status === "Present" ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground">
                  Xác nhận điểm danh
                </h4>
                <p className="text-xs text-muted">
                  {pendingCheckIn.student.fullName}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted-surface p-3.5 text-xs text-foreground space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted">Trạng thái ghi nhận:</span>
                <span className="font-bold text-foreground">
                  {ATTENDANCE_STATUS_LABELS[pendingCheckIn.status]}
                </span>
              </div>
              <p className="text-xs text-muted pt-1 border-t border-border">
                Lưu ý: Bản ghi điểm danh trong ngày sau khi ghi nhận sẽ được chốt và không thể chỉnh sửa.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setPendingCheckIn(null)}
                className="rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors shadow-2xs disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmCheckIn}
                className="rounded-lg bg-brand hover:bg-brand-hover text-card px-4 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
