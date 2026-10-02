import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface StatusMessageProps {
  status: "loading" | "error" | "empty";
  title?: string;
  message?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function StatusMessage({
  status,
  title,
  message,
  onRetry,
  action,
  className,
}: StatusMessageProps) {
  if (status === "loading") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center",
          className
        )}
      >
        <div className="relative mb-3 flex items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-brand-border border-t-brand" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {title ?? "Đang tải dữ liệu..."}
        </p>
        {message && <p className="mt-1 text-xs text-muted">{message}</p>}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-danger/20 bg-danger/5 p-8 text-center",
          className
        )}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger/10 text-danger">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h4 className="text-sm font-semibold text-danger">
          {title ?? "Không thể tải dữ liệu"}
        </h4>
        <p className="mt-1 max-w-md text-xs text-muted">
          {message ?? "Đã xảy ra sự cố trong quá trình kết nối máy chủ. Vui lòng thử lại."}
        </p>
        <div className="mt-4 flex items-center gap-2">
          {onRetry && (
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Thử lại
            </Button>
          )}
          {action}
        </div>
      </div>
    );
  }

  // status === "empty"
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 p-10 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h4 className="text-sm font-medium text-foreground">
        {title ?? "Chưa có dữ liệu"}
      </h4>
      <p className="mt-1 max-w-sm text-xs text-muted">
        {message ?? "Hiện tại chưa có thông tin nào được hiển thị tại đây."}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
