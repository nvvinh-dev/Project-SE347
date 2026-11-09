"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DURATION_MS = 5000;
const LEAVE_MS = 300;

export interface ToastMessage {
  /** Mỗi lần báo một id mới để cùng một câu vẫn hiện lại và đếm lại từ đầu. */
  id: number;
  text: string;
}

function ToastCard({ text, onClose }: { text: string; onClose: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), DURATION_MS);
    return () => clearTimeout(leaveTimer);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const closeTimer = setTimeout(onClose, LEAVE_MS);
    return () => clearTimeout(closeTimer);
  }, [leaving, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden rounded-xl border border-brand-border bg-card shadow-xl transition-all duration-300 ease-out sm:w-96",
        "starting:translate-y-4 starting:opacity-0",
        leaving ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <p className="min-w-0 flex-1 self-center text-sm font-medium text-foreground [overflow-wrap:anywhere]">{text}</p>
        <button
          type="button"
          aria-label="Đóng thông báo"
          className="-m-1 shrink-0 cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-background hover:text-foreground"
          onClick={() => setLeaving(true)}
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={2} d="m6 6 12 12M6 18 18 6" />
          </svg>
        </button>
      </div>
      {/* Thanh thời gian: rút từ đầy về 0 trong 5 giây. */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-1 w-0 bg-brand transition-[width] ease-linear starting:w-full"
        style={{ transitionDuration: `${DURATION_MS}ms` }}
      />
    </div>
  );
}

/** Popup báo thành công nổi ở góc dưới màn hình, tự ẩn sau 5 giây. */
export function SuccessToast({ toast, onClose }: { toast: ToastMessage | null; onClose: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-auto sm:right-6 sm:bottom-6">
      {toast && <ToastCard key={toast.id} text={toast.text} onClose={onClose} />}
    </div>
  );
}
