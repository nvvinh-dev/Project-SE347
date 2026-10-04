import React from "react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  pageSizeOptions?: number[];
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  totalCount,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  // Tạo dải số trang hiển thị
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 py-3 text-xs text-muted",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span>
          Hiển thị{" "}
          <strong className="font-semibold text-foreground">{from}</strong> -{" "}
          <strong className="font-semibold text-foreground">{to}</strong> trên tổng{" "}
          <strong className="font-semibold text-foreground">{totalCount}</strong> mục
        </span>

        {onPageSizeChange && (
          <div className="ml-3 flex items-center gap-1.5">
            <span>/ trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-brand focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <nav aria-label="Phân trang" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Trang trước"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {getPageNumbers().map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors",
                p === page
                  ? "bg-brand text-white shadow-xs"
                  : "border border-border bg-card text-foreground hover:bg-background"
              )}
            >
              {p}
            </button>
          ) : (
            <span key={`dots-${idx}`} className="px-1 text-muted-light select-none">
              {p}
            </span>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Trang sau"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  );
}
