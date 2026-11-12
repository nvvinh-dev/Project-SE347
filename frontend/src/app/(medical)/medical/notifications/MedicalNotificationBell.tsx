"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { formatIncidentNotification, notificationPlainText } from "./_lib/formatIncidentNotification";
import { useNotifications } from "./_lib/useNotifications";

interface PanelPosition {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  maxHeight: number;
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function getPanelPosition(trigger: HTMLButtonElement): PanelPosition | null {
  if (!trigger.getClientRects().length) return null;
  const rect = trigger.getBoundingClientRect();
  const viewport = window.visualViewport;
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
  const margin = 8;
  const leftEdge = (viewport?.offsetLeft ?? 0) / zoom + margin;
  const topEdge = (viewport?.offsetTop ?? 0) / zoom + margin;
  const rightEdge = ((viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth)) / zoom - margin;
  const bottomEdge = ((viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight)) / zoom - margin;
  const width = Math.min(416, rightEdge - leftEdge);
  const left = Math.max(leftEdge, Math.min(rect.right / zoom - width, rightEdge - width));
  const spaceBelow = bottomEdge - rect.bottom / zoom - margin;
  const spaceAbove = rect.top / zoom - margin - topEdge;
  // Khi sidebar thu gọn, chuông nằm ở chân màn hình nên panel mở lên trên.
  if (spaceBelow < Math.min(320, spaceAbove)) {
    const bottom = Math.min(bottomEdge, rect.top / zoom - margin);
    return { left, width, bottom: window.innerHeight / zoom - bottom, maxHeight: Math.min(560, bottom - topEdge) };
  }
  const top = Math.max(topEdge, rect.bottom / zoom + margin);
  return { left, width, top, maxHeight: Math.min(560, bottomEdge - top) };
}

export function MedicalNotificationBell() {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const query = useNotifications(1, 10, isOpen);
  const data = query.data;

  const closePanel = useCallback((restoreFocus: boolean) => {
    setIsOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const focusFrame = requestAnimationFrame(() => panelRef.current?.focus());
    const updatePosition = () => {
      const trigger = triggerRef.current;
      const next = trigger ? getPanelPosition(trigger) : null;
      if (!next) { closePanel(false); return; }
      setPosition((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const isInside = (target: EventTarget | null) => target instanceof Node && (
      triggerRef.current?.contains(target) || panelRef.current?.contains(target)
    );
    const outsidePointer = (event: PointerEvent) => {
      if (!isInside(event.target)) closePanel(false);
    };
    const outsideFocus = (event: FocusEvent) => {
      if (!isInside(event.target)) closePanel(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closePanel(true); }
    };
    document.addEventListener("pointerdown", outsidePointer);
    document.addEventListener("focusin", outsideFocus);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", outsidePointer);
      document.removeEventListener("focusin", outsideFocus);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, closePanel]);

  return (
    <>
      <Button ref={triggerRef} variant="ghost" size="sm" className="h-10 w-10 shrink-0 p-0" title="Thông báo"
        aria-label="Thông báo sự cố" aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={isOpen ? id : undefined}
        onClick={() => {
          if (isOpen) { closePanel(true); return; }
          const next = triggerRef.current ? getPanelPosition(triggerRef.current) : null;
          if (next) { setPosition(next); setIsOpen(true); }
        }}>
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </Button>
      {isOpen && position && createPortal(
        <section id={id} ref={panelRef} role="dialog" aria-labelledby={`${id}-heading`} tabIndex={-1} style={position}
          className="fixed z-[60] flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl outline-none">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
            <div className="min-w-0">
              <h2 id={`${id}-heading`} className="text-sm font-semibold text-foreground">Thông báo sự cố</h2>
              {query.isFetching && data && <p className="mt-0.5 text-xs text-muted" role="status">Đang cập nhật...</p>}
            </div>
            <Button variant="ghost" size="sm" className="h-10 w-10 shrink-0 p-0" aria-label="Đóng thông báo" onClick={() => closePanel(true)}>
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="m6 6 12 12M6 18 18 6" /></svg>
            </Button>
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain" aria-busy={query.isFetching}>
            {query.isLoading ? <StatusMessage status="loading" title="Đang tải thông báo..." />
              : query.isError && !data ? <StatusMessage status="error" title="Không thể tải thông báo" message={query.error.message} onRetry={() => { void query.refetch(); }} />
              : data?.items.length === 0 ? <StatusMessage status="empty" title="Chưa có thông báo sự cố" message="Thông báo sẽ xuất hiện khi giáo viên ghi nhận sự cố mới." />
              : data && <>
                {query.isError && <div role="alert" className="m-3 space-y-2 rounded-lg border border-danger-border bg-danger-bg p-3 text-xs text-danger">
                  <p className="break-words [overflow-wrap:anywhere]">Chưa thể cập nhật thông báo. {query.error.message}</p>
                  <Button variant="secondary" size="sm" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>Thử lại</Button>
                </div>}
                <ol className="divide-y divide-border">
                  {data.items.map((item) => {
                    const fields = formatIncidentNotification(item.message);
                    return <li key={item.id}>
                      <Link href={`/medical/notifications?notificationId=${encodeURIComponent(item.id)}`} onClick={() => closePanel(false)}
                        aria-label={fields ? `Xem chi tiết thông báo của ${fields.childName}` : "Xem chi tiết thông báo sự cố"}
                        className="block min-w-0 space-y-2 px-4 py-3 transition-colors hover:bg-background focus-visible:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 004.3 20h15.4a2 2 0 001.7-2.8L13.7 3.9a2 2 0 00-3.4 0z" />
                            </svg>
                            <span className="line-clamp-1 break-words text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{fields?.childName ?? "Thông báo sự cố"}</span>
                          </div>
                          <span className="shrink-0 pt-0.5 text-xs text-muted">{fields?.occurredAtLabel ?? dateFormatter.format(new Date(item.createdAtUtc))}</span>
                        </div>
                        <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">{fields?.description ?? notificationPlainText(item.message)}</p>
                      </Link>
                    </li>;
                  })}
                </ol>
              </>}
          </div>
          <div className="shrink-0 border-t border-border p-2">
            <Link href="/medical/notifications" onClick={() => closePanel(false)}
              className="flex min-h-11 items-center justify-center rounded-lg text-sm font-semibold text-brand-text transition-colors hover:bg-brand-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand">Xem tất cả</Link>
          </div>
        </section>, document.body
      )}
    </>
  );
}
