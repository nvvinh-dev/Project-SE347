"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Link from "next/link";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuth } from "@/context/AuthContext";
import { useApiMutation, useApiQuery } from "@/hooks/useApiQuery";
import { checkInStudent, formatAttendanceTime, getAttendanceForDate, getHomeroomChildren, getVietnamDate } from "@/lib/attendance";
import {
  ATTENDANCE_STATUS_LABELS,
  type AttendanceChild,
  type AttendanceResponse,
  type AttendanceStatus,
  type HomeroomChildResponse,
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

export function AttendanceScreen({ roster: providedRoster }: { roster?: readonly AttendanceChild[] }) {
  const { user } = useAuth();
  const date = useVietnamDate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingCheckIn | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string; errors?: string[] | null } | null>(null);
  const [showHealth, setShowHealth] = useState(true);
  const [expandedHealthId, setExpandedHealthId] = useState<string | null>(null);
  const [needsRecheck, setNeedsRecheck] = useState(false);
  // Chặn hai lần xác nhận liên tiếp trước khi trạng thái đang gửi được render.
  const submitLock = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const pendingIndexRef = useRef<number>(-1);
  const screenRef = useRef<HTMLDivElement>(null);
  // Đợi danh sách cập nhật để trả focus về nút cũ hoặc trẻ kế tiếp còn chưa điểm danh.
  const focusRestore = useRef<{ next: boolean; index: number } | null>(null);

  const { register, control, reset } = useForm<Filters>({
    defaultValues: { search: "", status: "All" },
  });
  const { search = "", status = "All" } = useWatch({ control });

  const rosterQuery = useApiQuery<HomeroomChildResponse[]>({
    queryKey: ["teacher-homeroom-children", user?.userId],
    queryFn: ({ signal }) => getHomeroomChildren(signal),
    enabled: Boolean(user?.userId) && providedRoster === undefined,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchInterval: 60_000,
  });
  const roster = providedRoster ?? rosterQuery.data?.map((child) => ({
    childId: child.id, fullName: child.fullName, healthNotes: child.healthNotes,
  }));

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
      ? []
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
    if (!restore || pending || submitLock.current) return;
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
    const [attendanceResult, rosterResult] = await Promise.all([
      query.refetch(),
      providedRoster === undefined ? rosterQuery.refetch() : Promise.resolve(null),
    ]);
    const verified = attendanceResult.isSuccess && (rosterResult === null || rosterResult.isSuccess);
    if (verified) setNeedsRecheck(false);
    return verified;
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
      void queryClient.invalidateQueries({ queryKey: ["teacher-attendance-history", user?.userId] });
    },
    onError: async (error) => {
      setFeedback({ kind: "error", text: error.message, errors: error.errors });
      closeDialog(false);
      if (error.status !== 400) {
        // Lỗi 4xx đã rõ kết quả; mất kết nối, lỗi máy chủ hoặc phản hồi thành công không hợp lệ cần xác minh.
        setNeedsRecheck(error.status == null || error.status < 400 || error.status >= 500);
        await recheck();
      }
    },
    onSettled: () => {
      submitLock.current = false;
    },
  });

  // Lỗi tải lại ngầm vẫn giữ dữ liệu đã có; backend kiểm tra lại quyền và bản ghi trùng khi gửi.
  const canWrite =
    roster !== undefined &&
    query.data !== undefined &&
    !mutation.isPending &&
    !needsRecheck;

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
      mutation.isPending
    ) {
      return;
    }
    if (pending.date !== getVietnamDate()) {
      setFeedback({ kind: "error", text: "Đã sang ngày mới. Vui lòng tải lại và chọn trạng thái điểm danh cho hôm nay." });
      closeDialog();
      void recheck();
      return;
    }
    // Dữ liệu có thể đổi khi hộp thoại đang mở; để backend quyết định kết quả và trả thông báo.
    submitLock.current = true;
    mutation.mutate(pending);
  };

  const isRefreshing = query.isFetching || (providedRoster === undefined && rosterQuery.isFetching);
  const hasRoster = roster !== undefined;
  const hasCurrentData = hasRoster && query.data !== undefined;
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
        <div className="w-full min-w-0">
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
          className="grid w-full grid-cols-3 gap-1 sm:gap-1.5"
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
        className="grid w-full min-w-0 grid-cols-3 items-center gap-2"
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
      <div className="flex items-start justify-between gap-1.5 sm:justify-start sm:gap-2">
        <span className="min-w-0 break-words text-sm font-medium text-foreground">{student.fullName}</span>
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
            className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 p-0 text-warning hover:bg-warning-bg ${view === "card" ? "-my-1.5" : ""}`}
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
          <span className="font-semibold text-warning">Lưu ý sức khỏe: </span>
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
      <PageHeader
        title="Điểm danh vào lớp"
        description="Ghi nhận trạng thái đến lớp hàng ngày của học sinh lớp chủ nhiệm"
      >
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-brand-border bg-brand-subtle px-3 text-xs font-medium text-brand-text">
          Lớp chủ nhiệm:
          <span className="font-bold tabular-nums">
            {hasRoster ? roster.length : "—"}
          </span>
          <span>học sinh</span>
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

      <section aria-label="Tình hình điểm danh hôm nay" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-0 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-muted leading-tight">{metric.label}</p>
              <span className={`shrink-0 text-xs font-semibold tabular-nums ${metric.color}`}>
                {metric.percentage}
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <p className={`text-xl sm:text-2xl font-bold tabular-nums ${metric.color}`}>
                {metric.value ?? "—"}
              </p>
              <span className="text-xs text-muted-light">{metric.unit}</span>
            </div>
          </div>
        ))}
      </section>

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

      <div
        className={`grid min-w-0 items-start gap-4 ${
          hasRoster ? (showHealth ? "xl:grid-cols-[minmax(0,1fr)_340px]" : "xl:grid-cols-[minmax(0,1fr)_64px]") : ""
        }`}
      >
        <section
          aria-label="Danh sách điểm danh hôm nay"
          className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs"
        >
          <form
            className="flex w-full min-w-0 flex-col items-stretch gap-2.5 border-b border-border p-3 sm:flex-row sm:items-end sm:p-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <FormField id="attendance-search" label="Tìm học sinh theo họ tên" className="min-w-0 flex-1">
              <Input
                id="attendance-search"
                type="search"
                placeholder="Tìm họ tên..."
                className="min-h-11 w-full px-2 text-xs sm:px-3.5"
                {...register("search")}
              />
            </FormField>

            <div className="flex min-w-0 items-end gap-2.5 sm:shrink-0">
              <FormField id="attendance-filter" label="Lọc trạng thái điểm danh" className="min-w-0 flex-1 sm:w-48 sm:flex-none">
                <Select
                  id="attendance-filter"
                  title={filters.find((filter) => filter.value === status)?.label}
                  options={filters.map((filter) => ({
                    value: filter.value,
                    label: `${filter.label} (${filter.total ?? "—"})`,
                  }))}
                  className="min-h-11 pl-2 text-[11px] sm:pl-3.5 sm:text-xs"
                  {...register("status")}
                />
              </FormField>

              <Button
                variant="secondary"
                size="sm"
                className="h-11 w-11 shrink-0 p-0 text-xs font-medium sm:w-auto sm:px-3"
                aria-label={isRefreshing ? "Đang tải điểm danh" : "Tải lại"}
                title={isRefreshing ? "Đang tải điểm danh" : "Tải lại"}
                disabled={isRefreshing || mutation.isPending}
                onClick={() => {
                  void recheck();
                }}
              >
                <svg
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 ${isRefreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.55-1.3L20 8M4 16l2.35 2.3A7 7 0 0 0 17.9 17" />
                </svg>
                <span className="hidden sm:inline">{isRefreshing ? "Đang tải..." : "Tải lại"}</span>
              </Button>
            </div>
          </form>

          {needsRecheck && (
            <div role="alert" className="border-b border-warning-border bg-warning-bg p-3 text-sm text-warning">
              Chưa xác định được kết quả ghi nhận. Hãy tải lại thành công trước khi ghi tiếp.
            </div>
          )}
          {providedRoster === undefined && rosterQuery.isError && rosterQuery.data !== undefined && (
            <div role="alert" className="border-b border-danger-border bg-danger-bg p-3 text-sm text-danger">
              <p>{[rosterQuery.error.message, ...(rosterQuery.error.errors ?? [])].join(" ")}</p>
              <p className="mt-1">Danh sách lớp và lưu ý sức khỏe đang hiển thị là dữ liệu tải thành công gần nhất.</p>
              <Button variant="secondary" size="sm" className="mt-2" disabled={rosterQuery.isFetching} onClick={() => { void recheck(); }}>Thử lại</Button>
            </div>
          )}
          {query.isError && query.data !== undefined && (
            <div role="alert" className="border-b border-danger-border bg-danger-bg p-3 text-sm text-danger">
              <p>{[query.error.message, ...(query.error.errors ?? [])].join(" ")}</p>
              <p className="mt-1">Danh sách bên dưới là dữ liệu tải thành công gần nhất.</p>
              <Button variant="secondary" size="sm" className="mt-2" disabled={query.isFetching} onClick={() => { void recheck(); }}>Thử lại</Button>
            </div>
          )}
          {roster === undefined ? (
            <StatusMessage
              status={rosterQuery.isError ? "error" : "loading"}
              title={rosterQuery.isError ? "Không thể tải danh sách lớp" : "Đang tải danh sách lớp..."}
              message={rosterQuery.error ? [rosterQuery.error.message, ...(rosterQuery.error.errors ?? [])].join(" ") : undefined}
              onRetry={rosterQuery.isError ? () => { void recheck(); } : undefined}
            />
          ) : query.data === undefined && !query.isError ? (
            <StatusMessage status="loading" title="Đang tải điểm danh hôm nay..." />
          ) : query.isError && query.data === undefined ? (
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

              <ul className="divide-y divide-border/60 lg:hidden">
                {filtered.map((student, index) => (
                  <li key={student.childId} className="space-y-3 p-3.5 sm:p-4">
                    {renderStudentName(student, "card")}
                    <div className="w-full min-w-0">{renderAttendanceAction(student, "card", index)}</div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted">
                <span>
                  Hiển thị {filtered.length} / {students.length} học sinh
                  {hasRoster ? " trong lớp" : " đã điểm danh hôm nay"}
                  {status !== "All"
                    ? ` · ${filters.find((filter) => filter.value === status)?.label}`
                    : ""}
                </span>
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
                <span>Bản ghi không thể sửa hoặc xóa</span>
              </div>
            </>
          )}
        </section>

        {hasRoster && <aside
          aria-label="Lưu ý sức khỏe của học sinh"
          className="hidden min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs xl:block"
        >
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

          <div id="attendance-health-content" hidden={!showHealth} className="bg-background/70">
            {!healthAvailable ? (
              <div className="p-4 text-center">
                <p className="text-xs font-medium text-muted">Chưa có dữ liệu lưu ý sức khỏe</p>
                <p className="mt-1 text-[11px] text-muted-light">
                  Vui lòng tải lại danh sách lớp để xem lưu ý sức khỏe.
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
                        <p className="min-w-0 break-words text-sm font-semibold text-foreground leading-snug">
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
        </aside>}
      </div>

      <ConfirmDialog
        isOpen={pending !== null}
        title="Xác nhận điểm danh"
        confirmText="Ghi nhận"
        cancelText="Hủy"
        isLoading={mutation.isPending}
        description={
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{pending?.child.fullName}</p>
            <p>Trạng thái: {pending ? ATTENDANCE_STATUS_LABELS[pending.status] : ""}</p>
            <p className="text-xs text-muted">
              Bản ghi điểm danh sau khi tạo không thể sửa hoặc xóa.
            </p>
          </div>
        }
        onClose={() => closeDialog(false)}
        onConfirm={confirmCheckIn}
      />
    </div>
  );
}
