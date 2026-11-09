"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface TuitionModalProps {
  title: string;
  description?: string;
  isBusy: boolean;
  /** Hộp xác nhận con đang mở: khóa nội dung popup, Escape chỉ đóng hộp con. */
  nestedOpen?: boolean;
  onNestedEscape?: () => void;
  onClose: () => void;
  footer: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
}

function isBackdropEvent(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return false;
  const bounds = event.currentTarget.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right
    || event.clientY < bounds.top || event.clientY > bounds.bottom;
}

/** Khung popup cho màn học phí, cùng kiểu với popup hồ sơ trẻ. */
export function TuitionModal({
  title, description, isBusy, nestedOpen = false, onNestedEscape, onClose, footer, overlay, children,
}: TuitionModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPointerRef = useRef<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    // showModal đưa popup lên top layer và vô hiệu hóa phần nền.
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      // ConfirmDialog con cũng khóa cuộn; dọn lần cuối sau cleanup của nó.
      queueMicrotask(() => {
        if (!document.querySelector("dialog[open], [aria-modal='true']")) {
          document.body.style.overflow = previousOverflow;
        }
      });
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const requestClose = () => {
    if (!isBusy && !nestedOpen) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl outline-none backdrop:bg-black/40 backdrop:backdrop-blur-xs"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape" && nestedOpen) {
          event.preventDefault();
          event.stopPropagation();
          onNestedEscape?.();
          return;
        }
        if (event.key !== "Tab" || nestedOpen) return;

        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex='0']",
        )).filter((element) => !element.closest("[inert]") && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        const active = document.activeElement;

        if (!first || !last) {
          event.preventDefault();
          event.currentTarget.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onPointerDown={(event) => {
        backdropPointerRef.current = event.button === 0 && isBackdropEvent(event) ? event.pointerId : null;
      }}
      onPointerUp={(event) => {
        // Chỉ đóng khi cả nhấn và thả đều trên nền; kéo chọn chữ ra ngoài vẫn giữ form.
        const closeFromBackdrop = backdropPointerRef.current === event.pointerId && isBackdropEvent(event);
        backdropPointerRef.current = null;
        if (closeFromBackdrop) requestClose();
      }}
      onPointerCancel={() => { backdropPointerRef.current = null; }}
    >
      <div inert={nestedOpen} className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
            )}
          </div>
          <Button
            variant="ghost" size="sm" disabled={isBusy} onClick={requestClose}
            aria-label="Đóng popup" className="h-9 w-9 shrink-0 p-0!"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeWidth={1.75} d="m6 6 12 12M6 18 18 6" />
            </svg>
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border bg-card px-5 py-4 sm:px-6">
          {footer}
        </footer>
      </div>
      {overlay}
    </dialog>
  );
}
