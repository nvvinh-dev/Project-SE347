"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ChildSelect } from "@/components/parent/ChildSelect";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { Pagination } from "@/components/ui/Pagination";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useMyChildren } from "@/hooks/useMyChildren";
import { useParentAttendance } from "@/hooks/useParentAttendance";
import { formatAttendanceDate, formatAttendanceTime } from "@/lib/attendance";
import { cn } from "@/lib/utils";
import {
  ATTENDANCE_STATUS_LABELS,
  type AttendanceStatus,
  type ChildAttendanceResponse,
} from "@/types/attendance";
import type { MyChildResponse } from "@/types/children";

const PAGE_SIZE = 10;
const STATUS_CLASSES: Record<AttendanceStatus, string> = {
  Present: "border-brand-border bg-brand-subtle text-brand-text",
  AbsentExcused: "border-warning-border bg-warning-bg text-amber-800",
  AbsentUnexcused: "border-danger-border bg-danger-bg text-red-700",
};

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium sm:text-sm",
      STATUS_CLASSES[status] ?? "border-border bg-background text-muted",
    )}>
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {ATTENDANCE_STATUS_LABELS[status] ?? "Chưa xác định"}
    </span>
  );
}

function getPresentTime(record: ChildAttendanceResponse) {
  // Giờ ghi nhận vắng không phải giờ trẻ có mặt, nên không hiển thị ở cả desktop và mobile.
  if (record.status !== "Present") return null;

  const utc = record.checkInTimeUtc;
  // Giờ thiếu hoặc mặc định không được biến thành một giờ có mặt hợp lệ.
  if (typeof utc !== "string" || !utc
      || utc.startsWith("0001-01-01") || !Number.isFinite(Date.parse(utc))) {
    return null;
  }
  return { utc, label: formatAttendanceTime(utc) };
}

function RefreshErrorNotice({ message, onRetry, isFetching }: {
  message: string;
  onRetry: () => void;
  isFetching: boolean;
}) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-warning-border bg-warning-bg px-4 py-3 text-sm sm:px-6">
      <p className="min-w-0 flex-1 text-foreground">
        {message} <span className="text-muted">Đang hiển thị dữ liệu đã tải trước đó.</span>
      </p>
      <Button size="sm" variant="secondary" disabled={isFetching} onClick={onRetry}>Thử lại</Button>
    </div>
  );
}

function AttendanceHistory({ attendance }: { attendance: ReturnType<typeof useParentAttendance> }) {
  const [page, setPage] = useState(1);
  // API đã sắp ngày mới nhất trước; giữ nguyên thứ tự khi phân trang tại frontend.
  const records = attendance.data ?? [];
  // Lỗi tạm thời giữ dữ liệu cũ; lỗi ngoài phạm vi phải ẩn toàn bộ dữ liệu đã lưu.
  const hasVisibleData = attendance.data !== undefined
    && attendance.error?.status !== 403 && attendance.error?.status !== 404;
  const showError = attendance.isError && !hasVisibleData;
  const safePage = Math.min(page, Math.max(1, Math.ceil(records.length / PAGE_SIZE)));
  const start = (safePage - 1) * PAGE_SIZE;
  const columns: Column<ChildAttendanceResponse>[] = [
    {
      key: "attendanceDate",
      className: "text-center",
      header: <><span className="sm:hidden">Ngày</span><span className="hidden sm:inline">Ngày điểm danh</span></>,
      render: (record) => {
        const time = getPresentTime(record);
        return (
          <div className="space-y-1.5">
            <time dateTime={record.attendanceDate} className="font-medium tabular-nums">
              {formatAttendanceDate(record.attendanceDate)}
            </time>
            {time && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted sm:hidden">
                <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 2" />
                </svg>
                <time dateTime={time.utc} aria-label={`Giờ ghi nhận ${time.label}`} className="tabular-nums">{time.label}</time>
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-40 text-center sm:w-56",
      render: (record) => <AttendanceBadge status={record.status} />,
    },
    {
      key: "checkInTimeUtc",
      header: "Giờ ghi nhận",
      className: "hidden text-center sm:table-cell",
      render: (record) => {
        const time = getPresentTime(record);
        return time
          ? <time dateTime={time.utc} className="tabular-nums">{time.label}</time>
          : <span className="text-muted" aria-label={record.status === "Present" ? "Chưa có giờ ghi nhận" : "Ẩn giờ ghi nhận khi vắng"}>—</span>;
      },
    },
  ];

  return (
    <>
      {attendance.isError && hasVisibleData && (
        <RefreshErrorNotice message={attendance.error.message} isFetching={attendance.isFetching}
          onRetry={() => { void attendance.refetch(); }} />
      )}
      <div aria-busy={attendance.isFetching}>
        <div role={attendance.isLoading ? "status" : showError ? "alert" : undefined}>
          <DataTable
            columns={columns}
            data={records.slice(start, start + PAGE_SIZE)}
            keyExtractor={(record) => record.id}
            isLoading={attendance.isLoading}
            isError={showError}
            errorMessage={attendance.error?.message}
            onRetry={() => { void attendance.refetch(); }}
            emptyMessage="Chưa có bản ghi điểm danh cho trẻ này."
            className="rounded-none! border-0! shadow-none! [&_table]:table-fixed [&_td]:px-3 [&_td]:py-4 [&_th]:px-3 [&_thead]:bg-brand-subtle/50 sm:[&_td]:px-6 sm:[&_th]:px-6"
          />
        </div>
      </div>
      {hasVisibleData && records.length > PAGE_SIZE && (
        <Pagination
          page={safePage}
          pageSize={PAGE_SIZE}
          totalCount={records.length}
          onPageChange={setPage}
          showSummary={false}
          className="justify-end! border-t border-border px-4 py-4! [&_nav]:max-w-full [&_nav]:flex-wrap sm:px-6"
        />
      )}
    </>
  );
}

function ChildAttendanceViewer({ childOptions }: { childOptions: MyChildResponse[] }) {
  const { control } = useForm<{ childId: string }>({
    defaultValues: { childId: childOptions[0].id },
  });
  const childId = useWatch({ control, name: "childId" });
  // Nếu liên kết bị gỡ khi tải lại danh sách, không tiếp tục hiển thị trẻ đã bị loại.
  const child = childOptions.find((item) => item.id === childId) ?? childOptions[0];
  const attendance = useParentAttendance(child.id);
  const showCount = (attendance.data?.length ?? 0) > 0
    && attendance.error?.status !== 403 && attendance.error?.status !== 404;

  return (
    <section aria-labelledby="attendance-heading" className="min-w-0 rounded-2xl border border-border bg-card shadow-xs">
      <h2 id="attendance-heading" className="sr-only">Lịch sử điểm danh của {child.fullName}</h2>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-5">
        <div className="w-full min-w-0 sm:max-w-sm">
          <FormField id="attendance-child" label="Chọn con" className="[&_label]:text-sm">
            <Controller
              name="childId"
              control={control}
              render={({ field }) => (
                <ChildSelect
                  {...field}
                  id="attendance-child"
                  value={child.id}
                  options={childOptions}
                />
              )}
            />
          </FormField>
        </div>
        {showCount && (
          <p role="status" className="text-sm text-muted sm:pb-2.5">
            {attendance.isFetching ? "Đang cập nhật…" : `${attendance.data?.length} ngày điểm danh`}
          </p>
        )}
      </div>
      <div className="overflow-hidden rounded-b-2xl">
        {/* Chỉ đặt lại phần bảng khi đổi trẻ để ô chọn vẫn giữ focus. */}
        <AttendanceHistory key={child.id} attendance={attendance} />
      </div>
    </section>
  );
}

export default function ParentAttendancePage() {
  const children = useMyChildren();
  const records = children.data ?? [];
  const hasVisibleData = children.data !== undefined
    && children.error?.status !== 403 && children.error?.status !== 404;

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader title="Lịch sử điểm danh" />
      {children.isError && hasVisibleData && (
        <div className="overflow-hidden rounded-xl border border-warning-border">
          <RefreshErrorNotice message={children.error.message} isFetching={children.isFetching}
            onRetry={() => { void children.refetch(); }} />
        </div>
      )}
      <div aria-busy={children.isFetching}>
        {children.isLoading ? (
          <div role="status"><StatusMessage status="loading" title="Đang tải danh sách con…" /></div>
        ) : children.isError && !hasVisibleData ? (
          <div role="alert">
            <StatusMessage
              status="error"
              title="Không thể tải danh sách con"
              message={children.error.message}
              onRetry={() => { void children.refetch(); }}
            />
          </div>
        ) : records.length === 0 ? (
          <StatusMessage
            status="empty"
            title="Chưa có hồ sơ trẻ được liên kết"
            message="Vui lòng liên hệ nhà trường để liên kết tài khoản với hồ sơ của con."
          />
        ) : (
          <div className="space-y-6">
            <ChildAttendanceViewer childOptions={records} />
          </div>
        )}
      </div>
    </div>
  );
}
