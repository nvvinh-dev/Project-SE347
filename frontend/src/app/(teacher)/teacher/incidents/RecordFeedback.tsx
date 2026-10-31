import { useEffect, useRef } from "react";
import type { ApiError } from "@/lib/axios";

export function RecordError({ error }: { error: ApiError | null }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) {
      container.current?.focus();
    }
  }, [error]);

  if (!error) return null;

  return (
    <div
      ref={container}
      tabIndex={-1}
      role="alert"
      className="space-y-3 rounded-xl border border-danger-border bg-danger-bg p-4 focus:outline-none"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-danger">Chưa hoàn tất ghi nhận</h4>
          <p className="mt-1 text-xs text-danger/90 leading-relaxed">{error.message}</p>
          {Boolean(error.errors?.length) && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-danger">
              {error.errors?.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function SavedNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-success-border bg-success-bg p-4 transition-all"
    >
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <div className="min-w-0 flex-1 space-y-1 text-sm text-foreground wrap-anywhere">
        {children}
      </div>
    </div>
  );
}
