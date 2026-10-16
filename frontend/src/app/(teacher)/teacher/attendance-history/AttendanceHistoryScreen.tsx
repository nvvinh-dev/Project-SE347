"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormField } from "@/components/ui/FormField";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatAttendanceDate, formatAttendanceTime, getAttendanceHistory, getHomeroomChildren, getVietnamDate } from "@/lib/attendance";
import { ATTENDANCE_STATUS_LABELS, type AttendanceHistoryFilter, type AttendanceResponse, type HomeroomChildResponse } from "@/types/attendance";

type HistoryForm = { mode: "date" | "child"; date: string; childId: string };
const pageSize = 20;
function parseHistoryDate(value: string): string | undefined {
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!parts) return undefined;
  const iso = `${parts[3]}-${parts[2]}-${parts[1]}`;
  const date = new Date(`${iso}T12:00:00Z`);
  return Number(parts[3]) > 0 && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : undefined;
}
const badgeClasses = {
  Present: "border-success-border bg-success-bg text-success",
  AbsentExcused: "border-warning-border bg-warning-bg text-warning",
  AbsentUnexcused: "border-danger-border bg-danger-bg text-danger",
};

function StatusBadge({ record }: { record: AttendanceResponse }) {
  return <span className={`inline-flex min-h-9 items-center whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold md:h-8 md:min-h-8 md:py-0 ${badgeClasses[record.status]}`}>{ATTENDANCE_STATUS_LABELS[record.status]}</span>;
}

export function AttendanceHistoryScreen() {
  const { user } = useAuth();
  const [selection, setSelection] = useState<AttendanceHistoryFilter>(() => ({ date: getVietnamDate() }));
  const [page, setPage] = useState(1);
  const datePicker = useRef<HTMLInputElement>(null);
  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<HistoryForm>({
    defaultValues: { mode: "date", date: formatAttendanceDate(getVietnamDate()), childId: "" },
    shouldUnregister: true,
  });
  const mode = useWatch({ control, name: "mode" });
  const dateValue = useWatch({ control, name: "date" });
  const roster = useApiQuery<HomeroomChildResponse[]>({
    queryKey: ["teacher-homeroom-children", user?.userId],
    queryFn: ({ signal }) => getHomeroomChildren(signal),
    enabled: Boolean(user?.userId), retry: false, staleTime: 0,
  });
  const history = useApiQuery<AttendanceResponse[]>({
    queryKey: ["teacher-attendance-history", user?.userId, selection],
    queryFn: ({ signal }) => getAttendanceHistory(selection, signal),
    enabled: Boolean(user?.userId), retry: false, staleTime: 0,
  });
  const records = history.data ?? [];
  const currentPage = Math.min(page, Math.max(1, Math.ceil(records.length / pageSize)));
  const visible = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedChild = roster.data?.find((child) => child.id === selection.childId);
  const selectedLabel = selection.date ? `Ngày ${formatAttendanceDate(selection.date)}` : selectedChild?.fullName ?? "Trẻ đã chọn";
  const submit = (values: HistoryForm) => {
    const next = values.mode === "date" ? { date: parseHistoryDate(values.date)! } : { childId: values.childId };
    setPage(1);
    if (JSON.stringify(next) === JSON.stringify(selection)) void history.refetch();
    else setSelection(next);
  };
  const columns: Column<AttendanceResponse>[] = [
    {
      key: "child",
      header: "Họ và tên học sinh",
      className: "w-[32%] min-w-40 whitespace-normal break-words font-medium text-foreground",
      render: (record) => <span className="block max-w-64 break-words">{record.childFullName}</span>,
    },
    {
      key: "date",
      header: "Ngày điểm danh",
      className: "w-[24%] whitespace-nowrap tabular-nums text-foreground",
      render: (record) => formatAttendanceDate(record.attendanceDate),
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-[26%] whitespace-nowrap",
      render: (record) => <StatusBadge record={record} />,
    },
    {
      key: "time",
      header: "Giờ ghi nhận",
      className: "w-[18%] whitespace-nowrap tabular-nums text-muted",
      render: (record) => formatAttendanceTime(record.checkInTimeUtc),
    },
  ];
  const historyError = history.error ? [history.error.message, ...(history.error.errors ?? [])].join(" ") : undefined;

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Lịch sử điểm danh"
        description="Xem các bản ghi điểm danh của trẻ lớp mình theo một trẻ hoặc một ngày"
      >
        <Link
          href="/teacher/attendance"
          className="inline-flex min-h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-brand"
        >
          Điểm danh hôm nay
        </Link>
      </PageHeader>
      <section aria-label="Tra cứu lịch sử điểm danh" className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs">
        <form onSubmit={handleSubmit(submit)} className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]">
          <FormField id="history-mode" label="Tra cứu theo" className="col-span-2 min-w-0 sm:col-span-1">
            <Select id="history-mode" options={[{ value: "date", label: "Một ngày" }, { value: "child", label: "Một trẻ" }]} className="min-h-11" {...register("mode")} />
          </FormField>
          {mode === "date" ? (
            <FormField id="history-date" label="Ngày điểm danh" required error={errors.date?.message} className="col-span-2 min-w-0 sm:col-span-1">
              <div className="relative">
                <Input id="history-date" placeholder="dd/mm/yyyy" className="min-h-11 min-w-0" error={errors.date?.message} aria-invalid={Boolean(errors.date)}
                  {...register("date", { required: "Vui lòng chọn ngày điểm danh.", validate: (value) => Boolean(parseHistoryDate(value)) || "Nhập ngày hợp lệ theo định dạng dd/mm/yyyy." })}
                  rightIcon={<Button variant="ghost" size="sm" className="min-h-9 min-w-9 p-1" aria-label="Mở lịch chọn ngày" onClick={() => datePicker.current?.showPicker()}>
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
                  </Button>} />
                <Input ref={datePicker} type="date" tabIndex={-1} aria-hidden="true" className="sr-only" value={parseHistoryDate(dateValue ?? "") ?? ""}
                  onChange={(event) => setValue("date", event.target.value ? formatAttendanceDate(event.target.value) : "", { shouldDirty: true, shouldValidate: true })} />
              </div>
            </FormField>
          ) : (
            <FormField id="history-child" label="Học sinh" required error={errors.childId?.message} className="col-span-2 min-w-0 sm:col-span-1">
              <Select id="history-child" placeholder="Chọn học sinh" options={(roster.data ?? []).map((child) => ({ value: child.id, label: child.fullName }))}
                disabled={roster.data === undefined || roster.data.length === 0} className="min-h-11" error={errors.childId?.message} aria-invalid={Boolean(errors.childId)}
                {...register("childId", { required: "Vui lòng chọn học sinh.", validate: (value) => roster.data?.some((child) => child.id === value) || "Vui lòng chọn học sinh trong danh sách lớp hiện tại." })} />
            </FormField>
          )}
          <div className="flex items-end">
            <Button
              type="submit"
              className="min-h-11 w-full whitespace-nowrap"
              disabled={mode === "child" && !roster.data?.length}
            >
              <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Xem lịch sử</span>
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="min-h-11 w-full whitespace-nowrap"
              disabled={history.isFetching}
              onClick={() => { void history.refetch(); }}
            >
              <svg
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 ${history.isFetching ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.55-1.3L20 8M4 16l2.35 2.3A7 7 0 0 0 17.9 17" />
              </svg>
              <span>{history.isFetching ? "Đang tải..." : <>Tải lại<span className="hidden xl:inline"> kết quả</span></>}</span>
            </Button>
          </div>
        </form>
        {mode === "child" && roster.isPending && <StatusMessage status="loading" title="Đang tải danh sách lớp..." />}
        {mode === "child" && roster.isError && <div role="alert"><StatusMessage status="error" title="Không thể tải danh sách lớp" message={[roster.error.message, ...(roster.error.errors ?? [])].join(" ")} onRetry={() => { void roster.refetch(); }} /></div>}
        {mode === "child" && roster.data?.length === 0 && <StatusMessage status="empty" title="Danh sách lớp chưa có học sinh" message="Bạn vẫn có thể tra cứu điểm danh theo ngày." />}
      </section>
      <section aria-label="Kết quả lịch sử điểm danh" className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="min-w-0 break-words text-sm font-semibold text-foreground">{selectedLabel}</h2>
          {history.data !== undefined && (
            <span className="shrink-0 text-xs font-medium text-muted tabular-nums">
              {records.length} bản ghi
            </span>
          )}
        </div>
        {history.isError && history.data !== undefined && (
          <div role="alert" className="rounded-xl border border-danger-border bg-danger-bg p-4 text-sm text-danger">
            <p>{historyError}</p><p className="mt-1">Kết quả bên dưới là dữ liệu tải thành công gần nhất của lựa chọn này.</p>
            <Button variant="secondary" size="sm" className="mt-2" disabled={history.isFetching} onClick={() => { void history.refetch(); }}>Thử lại</Button>
          </div>
        )}
        {history.data === undefined ? (
          <div role={history.isError ? "alert" : "status"}><StatusMessage status={history.isError ? "error" : "loading"} title={history.isError ? "Không thể tải lịch sử điểm danh" : "Đang tải lịch sử điểm danh..."} message={historyError} onRetry={history.isError ? () => { void history.refetch(); } : undefined} /></div>
        ) : records.length === 0 ? (
          <StatusMessage status="empty" title="Chưa có bản ghi điểm danh" message="Không có bản ghi cho lựa chọn này. Vui lòng chọn ngày hoặc học sinh khác." />
        ) : (
          <div className="min-w-0 space-y-2">
          <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <div className="hidden min-w-0 md:block"><DataTable columns={columns} data={visible} keyExtractor={(record) => record.id} className="rounded-none border-0 shadow-none" /></div>
            <ul className="divide-y divide-border/60 md:hidden">
              {visible.map((record) => (
                <li key={record.id} className="flex min-w-0 items-center gap-3 px-3.5 py-2.5 sm:px-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="break-words text-sm font-medium leading-snug text-foreground">
                      {record.childFullName}
                    </p>
                    <p className="whitespace-nowrap text-xs tabular-nums text-muted">
                      <span className="sr-only">Ngày điểm danh: </span>
                      {formatAttendanceDate(record.attendanceDate)}
                      <span aria-hidden="true"> · </span>
                      <span className="sr-only">Giờ ghi nhận theo giờ Việt Nam: </span>
                      {formatAttendanceTime(record.checkInTimeUtc)}
                    </p>
                  </div>
                  <div className="shrink-0"><StatusBadge record={record} /></div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted">
              <span>Hiển thị {visible.length} / {records.length} bản ghi</span>
              <span title="Giờ ghi nhận được hiển thị theo giờ Việt Nam.">Bản ghi không thể sửa hoặc xóa</span>
            </div>
          </div>
            {records.length > pageSize && (
              <div className="min-w-0 overflow-x-auto">
                <Pagination page={currentPage} pageSize={pageSize} totalCount={records.length} onPageChange={setPage}
                  showSummary={false} className="justify-center gap-2 py-0! sm:justify-end" />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
