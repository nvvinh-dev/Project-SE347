"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Link from "next/link";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuth } from "@/context/AuthContext";
import { useApiMutation, useApiQuery } from "@/hooks/useApiQuery";
import { checkInStudent, formatAttendanceTime, getAttendanceForDate, getVietnamDate } from "@/lib/attendance";
import {
  ATTENDANCE_STATUS_LABELS,
  type AttendanceChild,
  type AttendanceResponse,
  type AttendanceStatus,
  type StudentAttendanceItem,
} from "@/types/attendance";

type Filter = "All" | "Unchecked" | AttendanceStatus;
type Filters = { search: string; status: Filter };
type PendingCheckIn = { child: AttendanceChild; status: AttendanceStatus; date: string };

const statusBadgeClasses: Record<AttendanceStatus, string> = {
  Present: "border-success-border bg-success-bg text-success",
  AbsentExcused: "border-warning-border bg-warning-bg text-warning",
  AbsentUnexcused: "border-danger-border bg-danger-bg text-danger",
};

const statuses = Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[];
const todayKey = (userId: string | undefined, date: string) => ["teacher-attendance", userId, date];

function useVietnamDate() {
  const [date, setDate] = useState(() => getVietnamDate());
  useEffect(() => {
    const update = () => setDate(getVietnamDate());
    const timer = window.setInterval(update, 15_000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return date;
}

export function AttendanceScreen({ roster }: { roster?: readonly AttendanceChild[] }) {
  const { user } = useAuth();
  const date = useVietnamDate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingCheckIn | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string; errors?: string[] | null } | null>(null);
  const [needsRecheck, setNeedsRecheck] = useState(false);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [showHealth, setShowHealth] = useState(true);
  const [expandedHealthId, setExpandedHealthId] = useState<string | null>(null);
  const submitLock = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const pendingIndexRef = useRef<number>(-1);
  const screenRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const focusRestore = useRef<{ next: boolean; index: number } | null>(null);

  const { register, control, reset } = useForm<Filters>({
    defaultValues: { search: "", status: "All" },
  });
  const { search = "", status = "All" } = useWatch({ control });

  const query = useApiQuery<AttendanceResponse[]>({
    queryKey: todayKey(user?.userId, date),
    queryFn: ({ signal }) => getAttendanceForDate(date, signal),
    enabled: Boolean(user?.userId),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchInterval: 60_000,
  });

  const records = query.data ?? [];
  const recordByChild = new Map(records.map((record) => [record.childId, record]));

  const students: StudentAttendanceItem[] =
    roster === undefined
      ? records.map((record) => ({
          childId: record.childId,
          fullName: record.childFullName,
          attendance: record,
        }))
      : roster.map((child) => ({
          ...child,
          attendance: recordByChild.get(child.childId) ?? null,
        }));

  const filtered = students.filter((child) => {
    if (!child.fullName.toLocaleLowerCase("vi-VN").includes(search.trim().toLocaleLowerCase("vi-VN"))) {
      return false;
    }
    if (status === "Unchecked") return child.attendance === null;
    return status === "All" || child.attendance?.status === status;
  });

  const closeDialog = (isSuccess = false) => {
    focusRestore.current = { next: isSuccess, index: pendingIndexRef.current };
    setPending(null);
  };

  useEffect(() => {
    const restore = focusRestore.current;
    if (!restore || pending || query.isFetching || submitLock.current) return;
    const available = (element: HTMLElement | null): element is HTMLElement =>
      Boolean(element?.isConnected && element.getClientRects().length &&
        !element.matches(":disabled"));
    const candidates = Array.from(
      screenRef.current?.querySelectorAll<HTMLButtonElement>("[data-checkin-index]") ?? []
    ).filter(available);
    const next = candidates.find((element) =>
      Number(element.dataset.checkinIndex) >= restore.index
    ) ?? candidates.at(-1);
    const target = !restore.next && available(trigger.current) ? trigger.current : next;
    (target ?? document.getElementById("attendance-filter"))?.focus();
    focusRestore.current = null;
  });

  const recheck = async () => {
    const result = await query.refetch();
    if (result.isSuccess) setNeedsRecheck(false);
    return result.isSuccess;
  };

  const mutation = useApiMutation<AttendanceResponse, PendingCheckIn>({
    mutationFn: ({ child, status: targetStatus }) => checkInStudent(child.childId, targetStatus),
    retry: false,
    onSuccess: (record) => {
      queryClient.setQueryData<AttendanceResponse[]>(
        todayKey(user?.userId, record.attendanceDate),
        (previous = []) => [
          ...previous.filter((item) => item.childId !== record.childId),
          record,
        ]
      );
      setFeedback({
        kind: "success",
        text: `Đã ghi nhận điểm danh: ${record.childFullName} — ${ATTENDANCE_STATUS_LABELS[record.status]}.`,
      });
      closeDialog(true);
      void queryClient.invalidateQueries({ queryKey: ["teacher-attendance", user?.userId] });
    },
    onError: async (error) => {
      setFeedback({ kind: "error", text: error.message, errors: error.errors });
      closeDialog(false);
      if (error.status === 403 || error.status === 404) setAccessBlocked(true);
      if (
        error.status === 409 ||
        error.status === null ||
        (error.status !== null && (error.status >= 500 || (error.status >= 200 && error.status < 300)))
      ) {
        setNeedsRecheck(true);
        await recheck();
      }
    },
    onSettled: () => {
      submitLock.current = false;
    },
  });

  const canWrite =
    roster !== undefined &&
    query.isSuccess &&
    !query.isFetching &&
    !mutation.isPending &&
    !needsRecheck &&
    !accessBlocked;

  const requestCheckIn = (child: AttendanceChild, targetStatus: AttendanceStatus) => {
    if (!canWrite || recordByChild.has(child.childId)) return;
    trigger.current = document.activeElement as HTMLElement;
    pendingIndexRef.current = filtered.findIndex((c) => c.childId === child.childId);
    setPending({ child, status: targetStatus, date });
    setFeedback(null);
  };

  const confirmCheckIn = () => {
    if (
      !pending ||
      submitLock.current ||
      !canWrite ||
      pending.date !== getVietnamDate() ||
      recordByChild.has(pending.child.childId)
    ) {
      if (!mutation.isPending) closeDialog(false);
      return;
    }
    submitLock.current = true;
    mutation.mutate(pending);
  };

  const hasRoster = roster !== undefined;
  const hasCurrentData = query.isSuccess;
  const count = (value: AttendanceStatus) =>
    students.filter((child) => child.attendance?.status === value).length;
  const unchecked = students.filter((child) => !child.attendance).length;
  const percentage = (value: number | null) =>
    hasRoster && hasCurrentData && roster.length > 0 && value !== null
      ? new Intl.NumberFormat("vi-VN", {
          style: "percent",
          maximumFractionDigits: 1,
        }).format(value / roster.length)
      : "—";

  const healthStudents = students.filter((child) => child.healthNotes?.trim());
  const healthAvailable = hasRoster && roster.every((child) => child.healthNotes !== undefined);

  const dateLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date + "T12:00:00Z"));

  const filters: { value: Filter; label: string; total: number | null }[] = [
    { value: "All", label: "Tất cả", total: hasCurrentData ? students.length : null },
    ...(hasRoster
      ? [
          {
            value: "Unchecked" as const,
            label: "Chưa điểm danh",
            total: hasCurrentData ? unchecked : null,
          },
        ]
      : []),
    ...statuses.map((value) => ({
      value,
      label: ATTENDANCE_STATUS_LABELS[value],
      total: hasCurrentData ? count(value) : null,
    })),
  ];

  const metrics = [
    {
      label: hasRoster ? "Sĩ số lớp" : "Bản ghi hôm nay",
      value: hasRoster ? roster.length : hasCurrentData ? records.length : null,
      percentage:
        hasRoster && hasCurrentData && roster.length > 0
          ? "100%"
          : "—",
      unit: "học sinh",
      color: "text-foreground",
    },
    {
      label: "Có mặt",
      value: hasCurrentData ? count("Present") : null,
      percentage: percentage(hasCurrentData ? count("Present") : null),
      unit: "học sinh",
      color: "text-success",
    },
    {
      label: "Vắng có phép",
      value: hasCurrentData ? count("AbsentExcused") : null,
      percentage: percentage(hasCurrentData ? count("AbsentExcused") : null),
      unit: "học sinh",
      color: "text-warning",
    },
    {
      label: "Vắng không phép",
      value: hasCurrentData ? count("AbsentUnexcused") : null,
      percentage: percentage(hasCurrentData ? count("AbsentUnexcused") : null),
      unit: "học sinh",
      color: "text-danger",
    },
    {
      label: "Chưa điểm danh",
      value: hasRoster && hasCurrentData ? unchecked : null,
      percentage: percentage(hasRoster && hasCurrentData ? unchecked : null),
      unit: "học sinh",
      color: "text-muted",
    },
  ];

  const renderAttendanceAction = (
    student: StudentAttendanceItem,
    view: "table" | "card",
    index?: number
  ) => {
    if (student.attendance) {
      if (view === "card") {
        return (
          <div
            className={`flex min-h-9 w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs font-medium ${
              statusBadgeClasses[student.attendance.status]
            }`}
          >
            <span className="font-semibold">
              {ATTENDANCE_STATUS_LABELS[student.attendance.status]}
            </span>
            <span className="tabular-nums font-normal opacity-80 text-[11px]">
              Đã ghi nhận ({formatAttendanceTime(student.attendance.checkInTimeUtc)})
            </span>
          </div>
        );
      }

      return (
        <div className="w-full max-w-[340px] sm:w-[340px] mx-auto">
          <div
            className={`flex h-8 w-full items-center justify-between rounded-md border px-3 text-xs font-medium whitespace-nowrap ${
              statusBadgeClasses[student.attendance.status]
            }`}
          >
            <span className="font-semibold">
              {ATTENDANCE_STATUS_LABELS[student.attendance.status]}
            </span>
            <span className="tabular-nums font-normal opacity-80 text-[11px]">
              Đã ghi nhận ({formatAttendanceTime(student.attendance.checkInTimeUtc)})
            </span>
          </div>
        </div>
      );
    }

    if (view === "card") {
      return (
        <div
          role="group"
          aria-label={`Điểm danh cho ${student.fullName}`}
          className="grid w-full grid-cols-3 gap-1.5"
        >
          <Button
            variant="outline"
            size="sm"
            data-checkin-index={index}
            disabled={!canWrite}
            onClick={() => requestCheckIn(student, "Present")}
            className="min-h-11 px-1 py-1 text-[11px] sm:text-xs font-medium leading-tight border-success-border/80 bg-success-bg/40 text-success hover:bg-success-bg hover:border-success disabled:opacity-40"
          >
            Có mặt
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canWrite}
            onClick={() => requestCheckIn(student, "AbsentExcused")}
            className="min-h-11 px-1 py-1 text-[11px] sm:text-xs font-medium leading-tight border-warning-border/80 bg-warning-bg/40 text-warning hover:bg-warning-bg hover:border-warning disabled:opacity-40"
          >
            Vắng có phép
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canWrite}
            onClick={() => requestCheckIn(student, "AbsentUnexcused")}
            className="min-h-11 px-1 py-1 text-[11px] sm:text-xs font-medium leading-tight border-danger-border/80 bg-danger-bg/40 text-danger hover:bg-danger-bg hover:border-danger disabled:opacity-40"
          >
            Vắng không phép
          </Button>
        </div>
      );
    }

    return (
      <div
        role="group"
        aria-label={`Điểm danh cho ${student.fullName}`}
        className="flex w-full max-w-[340px] sm:w-[340px] mx-auto items-center gap-2 whitespace-nowrap"
      >
        <Button
          variant="outline"
          size="sm"
          data-checkin-index={index}
          disabled={!canWrite}
          onClick={() => requestCheckIn(student, "Present")}
          className="flex-1 h-8 px-2 text-xs font-medium whitespace-nowrap border-success-border/80 bg-success-bg/40 text-success hover:bg-success-bg hover:border-success disabled:opacity-40"
        >
          Có mặt
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canWrite}
          onClick={() => requestCheckIn(student, "AbsentExcused")}
          className="flex-1 h-8 px-2 text-xs font-medium whitespace-nowrap border-warning-border/80 bg-warning-bg/40 text-warning hover:bg-warning-bg hover:border-warning disabled:opacity-40"
        >
          Vắng có phép
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canWrite}
          onClick={() => requestCheckIn(student, "AbsentUnexcused")}
          className="flex-1 h-8 px-2 text-xs font-medium whitespace-nowrap border-danger-border/80 bg-danger-bg/40 text-danger hover:bg-danger-bg hover:border-danger disabled:opacity-40"
        >
          Vắng không phép
        </Button>
      </div>
    );
  };

  const renderStudentName = (student: StudentAttendanceItem, view: "table" | "card") => (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground break-words min-w-0">{student.fullName}</span>
        {student.healthNotes?.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={`Lưu ý sức khỏe: ${student.healthNotes}`}
            aria-label={`Lưu ý sức khỏe: ${student.fullName}`}
            aria-expanded={expandedHealthId === student.childId}
            aria-controls={`health-detail-${view}-${student.childId}`}
            onClick={() =>
              setExpandedHealthId(expandedHealthId === student.childId ? null : student.childId)
            }
            className={`h-11 w-11 shrink-0 p-0 text-warning hover:bg-warning-bg ${view === "card" ? "-my-3" : ""}`}
          >
            <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-warning-border bg-warning-bg text-[10px] font-bold">!</span>
          </Button>
        )}
      </div>
      {student.healthNotes?.trim() && (
        <div
          id={`health-detail-${view}-${student.childId}`}
          hidden={expandedHealthId !== student.childId}
          className="mt-2 rounded-lg border border-warning-border/60 border-l-3 border-l-warning bg-warning-bg/40 p-2.5 text-xs leading-relaxed text-foreground shadow-2xs whitespace-pre-wrap break-words"
        >
          {student.healthNotes}
        </div>
      )}
    </div>
  );

  const columns: Column<StudentAttendanceItem>[] = [
    { key: "index", header: "STT", className: "w-14 text-center", render: (_, index) => index + 1 },
    { key: "name", header: "Họ và tên học sinh", className: "whitespace-normal min-w-40", render: (student) => renderStudentName(student, "table") },
    { key: "attendance", header: "Trạng thái & Điểm danh", className: "w-[372px] text-center", render: (student, index) => renderAttendanceAction(student, "table", index) },
  ];

  return (
    <div ref={screenRef} className="w-full min-w-0 space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Điểm danh vào lớp"
        description="Ghi nhận trạng thái đến lớp hàng ngày của học sinh lớp chủ nhiệm"
      >
        <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted">
          Lớp chủ nhiệm
        </span>
        <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground">
          {dateLabel}
        </span>
        <Link
          href="/teacher/attendance-history"
          className="inline-flex min-h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-brand"
        >
          Lịch sử điểm danh
        </Link>
      </PageHeader>

      {/* Summary Metrics */}
      <section aria-label="Tình hình điểm danh hôm nay" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs ${
              index === 4 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted">{metric.label}</p>
              <span className={`shrink-0 text-xs font-semibold tabular-nums ${metric.color}`}>
                {metric.percentage}
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <p className={`text-2xl font-bold tabular-nums ${metric.color}`}>
                {metric.value ?? "—"}
              </p>
              <span className="text-xs text-muted-light">{metric.unit}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Roster Alert */}
      {roster === undefined && (
        <div
          role="status"
          className="rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning"
        >
          <p className="font-semibold">Danh sách học sinh của lớp chưa sẵn sàng</p>
          <p className="mt-1 text-xs">
            Hiện chỉ hiển thị học sinh đã được điểm danh hôm nay. Bạn có thể ghi điểm danh khi danh sách lớp được kết nối.
          </p>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`rounded-xl border p-4 text-sm ${
            feedback.kind === "success"
              ? "border-success-border bg-success-bg text-success"
              : "border-danger-border bg-danger-bg text-danger"
          }`}
        >
          <p>{feedback.text}</p>
          {feedback.errors?.length ? (
            <ul className="mt-2 list-disc pl-5">
              {feedback.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {needsRecheck && (
        <div role="alert" className="rounded-xl border border-warning-border bg-warning-bg p-4 text-sm text-warning">
          Cần tải lại điểm danh để kiểm tra kết quả trước khi gửi tiếp.
        </div>
      )}

      {accessBlocked && (
        <div role="alert" className="rounded-xl border border-danger-border bg-danger-bg p-4 text-sm text-danger">
          Chưa thể gửi điểm danh. Vui lòng kiểm tra lại quyền và danh sách học sinh của lớp.
        </div>
      )}

      {/* Main Content: Attendance Table & Health Sidebar */}
      <div
        className={`grid min-w-0 items-start gap-4 ${
          showHealth ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "xl:grid-cols-[minmax(0,1fr)_64px]"
        }`}
      >
        {/* Left Column: Attendance Table */}
        <section
          aria-label="Danh sách điểm danh hôm nay"
          className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs"
        >
          {/* Toolbar: Expanded Search Bar on Left, Filter and Reload pinned to Right */}
          <form
            className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border p-3.5 sm:p-4"
            onSubmit={(event) => event.preventDefault()}
          >
            {/* Expanded Search Bar */}
            <div className="flex-1 min-w-[200px] w-full sm:w-auto">
              <label htmlFor="attendance-search" className="sr-only">
                Tìm học sinh theo họ tên
              </label>
              <Input
                id="attendance-search"
                type="search"
                placeholder="Tìm họ tên học sinh..."
                className="min-h-9 text-xs w-full"
                {...register("search")}
              />
            </div>

            {/* Right group: Filter, Reload, Clear Filter pinned to right edge */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
              <div className="w-44 sm:w-48 shrink-0">
                <label htmlFor="attendance-filter" className="sr-only">
                  Lọc trạng thái điểm danh
                </label>
                <Select
                  id="attendance-filter"
                  options={filters.map((filter) => ({
                    value: filter.value,
                    label: `${filter.label} (${filter.total ?? "—"})`,
                  }))}
                  className="min-h-9 text-xs"
                  {...register("status")}
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="min-h-9 shrink-0 text-xs font-medium"
                disabled={query.isFetching || mutation.isPending}
                onClick={() => {
                  void recheck();
                }}
              >
                {query.isFetching ? "Đang tải..." : "Tải lại"}
              </Button>

              {(search || status !== "All") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => reset()}
                  className="h-9 px-2 text-xs font-medium text-muted hover:text-foreground whitespace-nowrap"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </form>

          {/* Table State Handling */}
          {!query.isSuccess && !query.isError ? (
            <StatusMessage status="loading" title="Đang tải điểm danh hôm nay..." />
          ) : query.isError ? (
            <div role="alert">
              <StatusMessage
                status="error"
                title="Không thể tải điểm danh"
                message={[query.error.message, ...(query.error.errors ?? [])].join(" ")}
                onRetry={() => {
                  void recheck();
                }}
              />
            </div>
          ) : students.length === 0 ? (
            <StatusMessage
              status="empty"
              title={hasRoster ? "Danh sách lớp chưa có học sinh" : "Chưa có bản ghi điểm danh hôm nay"}
              message={
                hasRoster
                  ? "Học sinh sẽ hiển thị tại đây sau khi được xếp vào lớp."
                  : "Các bản ghi sẽ hiển thị sau khi học sinh được điểm danh."
              }
            />
          ) : filtered.length === 0 ? (
            <StatusMessage
              status="empty"
              title="Không có học sinh phù hợp"
              message="Vui lòng đổi từ khóa tìm kiếm hoặc trạng thái điểm danh."
              action={
                <Button variant="secondary" size="sm" onClick={() => reset()}>
                  Xóa bộ lọc
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div
                role="region"
                aria-label="Bảng điểm danh"
                tabIndex={0}
                className="hidden focus-visible:outline-2 focus-visible:outline-brand lg:block"
              >
                <DataTable<StudentAttendanceItem>
                  columns={columns}
                  data={filtered}
                  keyExtractor={(student) => student.childId}
                  className="rounded-none border-0 shadow-none"
                />
              </div>

              {/* Mobile / Card List View */}
              <ul className="divide-y divide-border/60 lg:hidden">
                {filtered.map((student, index) => (
                  <li key={student.childId} className="space-y-3 p-4">
                    {renderStudentName(student, "card")}
                    <div>{renderAttendanceAction(student, "card", index)}</div>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted">
                <span>
                  Hiển thị {filtered.length} / {students.length} học sinh
                  {hasRoster ? " trong lớp" : " đã điểm danh hôm nay"}
                  {status !== "All"
                    ? ` · ${filters.find((filter) => filter.value === status)?.label}`
                    : ""}
                </span>
                <span>Bản ghi không thể sửa hoặc xóa</span>
              </div>
            </>
          )}
        </section>

        {/* Right Column: Health Notes Sidebar (Clean & High Readability) */}
        <aside
          aria-label="Lưu ý sức khỏe của học sinh"
          className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs"
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b border-border transition-colors ${
              showHealth ? "p-3.5" : "p-3.5 xl:flex-col xl:p-2 xl:py-3"
            }`}
          >
            {showHealth ? (
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Lưu ý sức khỏe</h2>
                <span className="rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-[11px] font-medium text-warning tabular-nums">
                  {healthAvailable ? `${healthStudents.length} học sinh` : "Dị ứng & bệnh nền"}
                </span>
              </div>
            ) : (
              <span
                aria-hidden="true"
                className="text-sm font-semibold text-foreground xl:text-xs xl:[writing-mode:vertical-rl] py-2"
              >
                Lưu ý sức khỏe
              </span>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={showHealth ? "Thu gọn lưu ý sức khỏe" : "Mở lưu ý sức khỏe"}
              aria-expanded={showHealth}
              aria-controls="attendance-health-content"
              onClick={() => setShowHealth(!showHealth)}
              className="h-11 w-11 shrink-0 p-0 text-muted hover:text-foreground"
            >
              <span className="text-sm font-bold">{showHealth ? "›" : "‹"}</span>
            </Button>
          </div>

          {/* Content */}
          <div id="attendance-health-content" hidden={!showHealth} className="bg-background/70">
            {!healthAvailable ? (
              <div className="p-4 text-center">
                <p className="text-xs font-medium text-muted">Chưa có dữ liệu lưu ý sức khỏe</p>
                <p className="mt-1 text-[11px] text-muted-light">
                  Lưu ý sẽ hiển thị khi danh sách học sinh của lớp được kết nối.
                </p>
              </div>
            ) : healthStudents.length === 0 ? (
              <div className="p-6 text-center space-y-1">
                <p className="text-xs font-medium text-muted">
                  Chưa có lưu ý sức khỏe nào được ghi nhận cho học sinh của lớp.
                </p>
                <p className="text-[11px] text-muted-light">
                  Các thông tin dị ứng hoặc bệnh nền sẽ xuất hiện tại đây khi được cập nhật.
                </p>
              </div>
            ) : (
              <div className="p-3 pb-1">
                <ul className="max-h-[34rem] space-y-2.5 overflow-y-auto pr-0.5">
                  {healthStudents.map((student) => (
                    <li
                      key={student.childId}
                      className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs transition-all hover:border-border-hover"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {student.fullName}
                        </p>
                        {student.attendance ? (
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                              statusBadgeClasses[student.attendance.status]
                            }`}
                          >
                            {ATTENDANCE_STATUS_LABELS[student.attendance.status]}
                          </span>
                        ) : (
                          <span className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted">
                            Chưa điểm danh
                          </span>
                        )}
                      </div>
                      {/* Health note box with subtle warm tint, border and accent edge */}
                      <div className="whitespace-pre-wrap break-words rounded-md border border-warning-border/60 border-l-3 border-l-warning bg-warning-bg/40 px-2.5 py-2 text-xs leading-relaxed text-foreground shadow-2xs">
                        {student.healthNotes}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 pt-1 text-right">
              <Link
                href="/teacher/class-children"
                className="text-xs font-medium text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-brand"
              >
                Xem tất cả lưu ý của lớp →
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key !== "Tab" || !pending) return;
          const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
          const first = buttons[0];
          const last = buttons.at(-1);
          if (!first || !last) {
            event.preventDefault();
            dialogRef.current?.focus();
          } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
      <ConfirmDialog
        isOpen={pending !== null && pending.date === date}
        title="Xác nhận điểm danh"
        confirmText="Ghi nhận"
        cancelText="Hủy"
        isLoading={mutation.isPending}
        description={
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{pending?.child.fullName}</p>
            <p>Trạng thái: {pending ? ATTENDANCE_STATUS_LABELS[pending.status] : ""}</p>
            <p className="text-xs text-muted">
              Bản ghi điểm danh sau khi tạo không thể sửa hoặc xóa. Ngày và giờ ghi nhận do hệ thống đặt.
            </p>
          </div>
        }
        onClose={() => closeDialog(false)}
        onConfirm={confirmCheckIn}
      />
      </div>
    </div>
  );
}
