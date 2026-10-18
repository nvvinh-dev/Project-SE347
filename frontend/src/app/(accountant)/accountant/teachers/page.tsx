"use client";

import { useRef, useState, type MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TeacherProfileModal } from "@/components/accountant/teachers/TeacherProfileModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { TEACHERS_QUERY_KEY, useTeachers } from "@/hooks/useTeachers";
import type { TeacherResponse } from "@/types/teachers";

const PAGE_SIZE = 10;
type Viewer = { mode: "create" } | { mode: "view"; id: string };
const formatDate = (value: string) => new Date(value).toLocaleDateString("vi-VN");

export default function AccountantTeachersPage() {
  const queryClient = useQueryClient();
  const teachers = useTeachers();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const records = teachers.data ?? [];
  const safePage = Math.min(page, Math.max(1, Math.ceil(records.length / PAGE_SIZE)));
  const start = (safePage - 1) * PAGE_SIZE;

  const open = (next: Viewer, trigger?: HTMLElement) => {
    openerRef.current = trigger ?? null;
    trigger?.focus({ preventScroll: true });
    setNotice(null);
    setViewer(next);
  };
  const close = () => {
    setViewer(null);
    requestAnimationFrame(() => {
      const opener = openerRef.current;
      (opener?.isConnected ? opener : addButtonRef.current)?.focus({ preventScroll: true });
    });
  };
  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest("button, a")) return;
    const trigger = target.closest("tbody tr")?.querySelector<HTMLButtonElement>("[data-teacher-id]");
    if (trigger?.dataset.teacherId) open({ mode: "view", id: trigger.dataset.teacherId }, trigger);
  };

  const columns: Column<TeacherResponse>[] = [
    { key: "index", header: "STT", className: "hidden w-16 sm:table-cell",
      render: (_teacher, index) => start + index + 1 },
    {
      key: "fullName", header: "Họ tên",
      render: (teacher) => (
        <div className="[overflow-wrap:anywhere]">
          <button type="button" data-teacher-id={teacher.id} aria-label={"Xem hồ sơ " + teacher.fullName}
            className="cursor-pointer text-left font-medium text-brand-text hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-brand"
            onClick={(event) => open({ mode: "view", id: teacher.id }, event.currentTarget)}>
            {teacher.fullName}
          </button>
          <p className="mt-1 text-xs text-muted md:hidden">{teacher.email}</p>
          <p className="mt-2 text-xs text-muted lg:hidden">Ngày lập: {formatDate(teacher.createdAtUtc)}</p>
        </div>
      ),
    },
    { key: "email", header: "Email", className: "hidden md:table-cell [overflow-wrap:anywhere]" },
    { key: "createdAtUtc", header: "Ngày lập hồ sơ", className: "hidden w-36 lg:table-cell",
      render: (teacher) => formatDate(teacher.createdAtUtc) },
    {
      key: "actions", header: <><span className="sm:hidden">Xem</span><span className="hidden sm:inline">Hành động</span></>,
      className: "w-20 sm:w-28",
      render: (teacher) => (
        <Button variant="outline" size="sm" aria-label={"Xem chi tiết " + teacher.fullName}
          onClick={(event) => open({ mode: "view", id: teacher.id }, event.currentTarget)}>Xem</Button>
      ),
    },
  ];

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader title="Quản lý hồ sơ giáo viên"
        description="Lập hồ sơ giáo viên để phục vụ phân công lớp.">
        <Button ref={addButtonRef} onClick={(event) => open({ mode: "create" }, event.currentTarget)}>
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeWidth={1.75} d="M12 5v14M5 12h14" />
          </svg>
          Thêm hồ sơ
        </Button>
      </PageHeader>
      {notice && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-brand-border bg-brand-subtle p-4 text-sm text-brand-text">
          <p className="min-w-0 [overflow-wrap:anywhere]">{notice}</p>
          <Button variant="ghost" size="sm" aria-label="Đóng thông báo" className="shrink-0"
            onClick={() => setNotice(null)}>Đóng</Button>
        </div>
      )}
      <section aria-label="Danh sách hồ sơ giáo viên" className="min-w-0 space-y-2"
        onClickCapture={handleRowClick}>
        <DataTable columns={columns} data={records.slice(start, start + PAGE_SIZE)}
          keyExtractor={(teacher) => teacher.id} isLoading={teachers.isLoading} isError={teachers.isError}
          errorMessage={teachers.error?.message} onRetry={() => { void teachers.refetch(); }}
          emptyMessage="Chưa có hồ sơ giáo viên nào."
          emptyAction={<Button variant="outline" onClick={(event) => open({ mode: "create" }, event.currentTarget)}>Thêm hồ sơ</Button>}
          className="[&_table]:table-fixed" />
        {!teachers.isLoading && !teachers.isError && records.length > 0 && (
          <Pagination page={safePage} pageSize={PAGE_SIZE} totalCount={records.length} onPageChange={setPage} />
        )}
      </section>
      {viewer && (
        <TeacherProfileModal key={viewer.mode === "view" ? viewer.id : "create"}
          teacherId={viewer.mode === "view" ? viewer.id : undefined} onClose={close}
          onCreated={(teacher) => {
            setNotice("Đã tạo hồ sơ cho " + teacher.fullName + " (" + teacher.email + ").");
            // API sắp theo tên, hồ sơ mới không nhất thiết nằm ở trang đầu.
            const updated = queryClient.getQueryData<TeacherResponse[]>(TEACHERS_QUERY_KEY) ?? [];
            const index = updated.findIndex((record) => record.id === teacher.id);
            setPage(Math.floor(Math.max(0, index) / PAGE_SIZE) + 1);
            close();
          }} />
      )}
    </div>
  );
}
