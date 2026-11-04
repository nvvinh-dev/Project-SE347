"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/utils";

interface SelectedPhotoModalProps {
  items: Array<{
    file: File;
    url: string;
  }>;
  currentIndex: number;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  onRemoveIndex: (index: number) => void;
  disabled?: boolean;
}

export default function SelectedPhotoModal({
  items,
  currentIndex,
  onClose,
  onSelectIndex,
  onRemoveIndex,
  disabled = false,
}: SelectedPhotoModalProps) {
  const { containerRef } = useFocusTrap({ isOpen: true, onClose });
  const current = items[currentIndex];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        onSelectIndex(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < items.length - 1) {
        e.preventDefault();
        onSelectIndex(currentIndex + 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, items.length, onSelectIndex]);

  if (!current) return null;

  const mbSize = (current.file.size / (1024 * 1024)).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh phóng to"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-3 sm:p-5 backdrop-blur-xs"
    >
      <div
        ref={containerRef}
        className={
          "relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden " +
          "rounded-2xl border border-border bg-card shadow-2xl"
        }
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-semibold text-brand-text">
              Ảnh {currentIndex + 1}/{items.length}
            </span>
            <span className="truncate text-xs text-muted" title={current.file.name}>
              {current.file.name} ({mbSize} MB)
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => onRemoveIndex(currentIndex)}
                className="h-8 px-2 text-xs text-danger hover:bg-danger-bg cursor-pointer"
              >
                Bỏ ảnh
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onClose}
              aria-label="Đóng xem ảnh"
              className={
                "flex h-8 w-8 items-center justify-center rounded-full p-0 " +
                "text-muted hover:text-foreground cursor-pointer"
              }
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="relative flex min-h-[16rem] max-h-[62dvh] flex-1 items-center justify-center overflow-hidden bg-background p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.file.name}
            className="max-h-[58dvh] w-auto max-w-full rounded-lg object-contain select-none"
          />

          {currentIndex > 0 && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => onSelectIndex(currentIndex - 1)}
              aria-label="Ảnh trước"
              className={
                "absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center " +
                "justify-center rounded-full p-0 shadow-md cursor-pointer"
              }
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          )}

          {currentIndex < items.length - 1 && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => onSelectIndex(currentIndex + 1)}
              aria-label="Ảnh sau"
              className={
                "absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center " +
                "justify-center rounded-full p-0 shadow-md cursor-pointer"
              }
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>

        {items.length > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border bg-card px-4 py-2.5">
            {items.map((item, idx) => (
              <Button
                variant="ghost"
                size="sm"
                key={idx}
                type="button"
                onClick={() => onSelectIndex(idx)}
                aria-label={`Chuyển sang ảnh ${idx + 1}`}
                className={cn(
                  "relative h-12 w-12 overflow-hidden rounded-md border p-0 transition-all cursor-pointer",
                  idx === currentIndex
                    ? "border-brand ring-2 ring-brand/30 shadow-xs opacity-100"
                    : "border-border opacity-70 hover:opacity-100 hover:border-brand-border"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="h-full w-full object-cover" />
                <span className="absolute bottom-0.5 right-0.5 rounded bg-foreground/75 px-1 text-[8px] font-semibold text-card">
                  {idx + 1}
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
