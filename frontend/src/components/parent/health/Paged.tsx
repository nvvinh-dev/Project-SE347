"use client";

import { useState, type ReactNode } from "react";
import { Pagination } from "@/components/ui/Pagination";

interface PagedProps<T> {
  items: T[];
  pageSize: number;
  children: (pageItems: T[]) => ReactNode;
}

/** Cắt danh sách đã tải đủ từ API (không phân trang phía server) thành từng trang ở frontend. */
export function Paged<T>({ items, pageSize, children }: PagedProps<T>) {
  const [page, setPage] = useState(1);
  const safePage = Math.min(page, Math.max(1, Math.ceil(items.length / pageSize)));
  const start = (safePage - 1) * pageSize;

  return (
    <>
      {children(items.slice(start, start + pageSize))}
      {items.length > pageSize && (
        <Pagination
          page={safePage}
          pageSize={pageSize}
          totalCount={items.length}
          onPageChange={setPage}
          showSummary={false}
          className="justify-end! border-t border-border px-4 py-3! [&_nav]:max-w-full [&_nav]:flex-wrap sm:px-6"
        />
      )}
    </>
  );
}
