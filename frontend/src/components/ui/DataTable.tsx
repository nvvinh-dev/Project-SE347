import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusMessage } from "./StatusMessage";

export interface Column<T> {
  key: string;
  header: ReactNode;
  className?: string;
  render?: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data?: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyMessage = "Không có dữ liệu hiển thị",
  emptyAction,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
        <StatusMessage status="loading" title="Đang tải dữ liệu bảng..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
        <StatusMessage
          status="error"
          title="Không thể tải danh sách"
          message={errorMessage}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
        <StatusMessage status="empty" message={emptyMessage} action={emptyAction} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-border bg-card shadow-xs",
        className
      )}
    >
      <table className="w-full text-left text-sm text-foreground">
        <thead className="border-b border-border bg-background/50 text-xs font-semibold text-muted uppercase tracking-wider">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn("px-4 py-3.5 whitespace-nowrap", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row, index)}
              className="transition-colors hover:bg-background/40"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn("px-4 py-3 text-sm align-middle", col.className)}
                >
                  {col.render
                    ? col.render(row, index)
                    : ((row as Record<string, unknown>)[col.key] == null
                      ? "—"
                      : String((row as Record<string, unknown>)[col.key]))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
