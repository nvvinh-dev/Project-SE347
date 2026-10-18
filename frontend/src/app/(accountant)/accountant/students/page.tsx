"use client";

import { useState, type MouseEvent } from "react";
import { ChildProfileModal } from "@/components/accountant/students/ChildProfileModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { useChildren } from "@/hooks/useChildren";
import type { ChildResponse } from "@/types/children";

type Editor = { mode: "create" } | { mode: "edit"; id: string };

const PAGE_SIZE = 10;

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "—";
}

export default function AccountantStudentsPage() {
  const children = useChildren();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [page, setPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const records = children.data ?? [];
  const safePage = Math.min(page, Math.max(1, Math.ceil(records.length / PAGE_SIZE)));
  const start = (safePage - 1) * PAGE_SIZE;

  const openEditor = (nextEditor: Editor, trigger?: HTMLElement) => {
    trigger?.focus({ preventScroll: true });
    setSuccessMessage(null);
    setEditor(nextEditor);
  };

  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest("button, a")) return;

    // DataTable chưa có onRowClick; lấy ID ở hàng thay vì phụ thuộc thứ tự phân trang.
    const trigger = target.closest("tbody tr")?.querySelector<HTMLButtonElement>("[data-child-id]");
    const id = trigger?.dataset.childId;
    if (id) openEditor({ mode: "edit", id }, trigger);
  };

  const columns: Column<ChildResponse>[] = [
    {
      key: "index",
      header: "STT",
      className: "hidden w-16 sm:table-cell",
      render: (_child, index) => start + index + 1,
    },
    {
      key: "fullName",
      header: "Họ tên",
      render: (child) => (
        <div className="[overflow-wrap:anywhere]">
          <button
            type="button"
            data-child-id={child.id}
            aria-label={`Xem hồ sơ ${child.fullName}`}
            className="cursor-pointer text-left font-medium text-brand-text hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-brand"
            onClick={(event) => openEditor({ mode: "edit", id: child.id }, event.currentTarget)}
          >
            {child.fullName}
          </button>
          <dl className="mt-2 space-y-1 text-xs text-muted sm:hidden">
            <div>
              <dt className="inline">Ngày sinh: </dt>
              <dd className="inline">{formatDate(child.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="inline">Ngày nhập học: </dt>
              <dd className="inline">{formatDate(child.enrollmentDate)}</dd>
            </div>
          </dl>
        </div>
      ),
    },
    {
      key: "dateOfBirth",
      header: "Ngày sinh",
      className: "hidden w-36 sm:table-cell",
      render: (child) => formatDate(child.dateOfBirth),
    },
    {
      key: "enrollmentDate",
      header: "Ngày nhập học",
      className: "hidden w-36 sm:table-cell",
      render: (child) => formatDate(child.enrollmentDate),
    },
    {
      key: "actions",
      header: <><span className="sm:hidden">Sửa</span><span className="hidden sm:inline">Hành động</span></>,
      className: "w-20 sm:w-28",
      render: (child) => (
        <Button
          size="sm"
          variant="outline"
          aria-label={`Sửa hồ sơ ${child.fullName}`}
          onClick={(event) => openEditor({ mode: "edit", id: child.id }, event.currentTarget)}
        >
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Quản lý hồ sơ trẻ"
        description="Quản lý thông tin nhập học và liên kết tài khoản phụ huynh."
      >
        <Button onClick={(event) => openEditor({ mode: "create" }, event.currentTarget)}>
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={1.75} d="M12 5v14M5 12h14" />
          </svg>
          Thêm hồ sơ
        </Button>
      </PageHeader>

      {successMessage && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-brand-border bg-brand-subtle p-4 text-sm text-brand-text">
          <p className="min-w-0 [overflow-wrap:anywhere]">{successMessage}</p>
          <button
            type="button"
            aria-label="Đóng thông báo"
            className="shrink-0 cursor-pointer font-medium hover:underline"
            onClick={() => setSuccessMessage(null)}
          >
            Đóng
          </button>
        </div>
      )}

      <section
        aria-label="Danh sách hồ sơ trẻ"
        className="min-w-0 space-y-2"
        onClickCapture={handleRowClick}
      >
        <DataTable
          columns={columns}
          data={records.slice(start, start + PAGE_SIZE)}
          keyExtractor={(child) => child.id}
          isLoading={children.isLoading}
          isError={children.isError}
          errorMessage={children.error?.message}
          onRetry={() => { void children.refetch(); }}
          emptyMessage="Chưa có hồ sơ trẻ nào"
          className="[&_table]:table-fixed [&_tbody_tr]:cursor-pointer"
        />
        {!children.isLoading && !children.isError && records.length > 0 && (
          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalCount={records.length}
            onPageChange={setPage}
          />
        )}
      </section>

      {editor && (
        <ChildProfileModal
          childId={editor.mode === "edit" ? editor.id : undefined}
          onCreated={(child) => setEditor({ mode: "edit", id: child.id })}
          onClose={() => setEditor(null)}
          onSuccess={setSuccessMessage}
        />
      )}
    </div>
  );
}
