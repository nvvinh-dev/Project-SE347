"use client";

import { useEffect, type MouseEvent, type ReactNode } from "react";
import { SignedImage } from "@/components/ui/SignedImage";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { formatMeasurementDateTime } from "@/lib/growth-measurements";
import type { ParentActivityPhoto } from "@/types/media";

interface PhotoLightboxProps {
  photos: ParentActivityPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Xin lại URL ký của một ảnh khi URL đang dùng đã hết hạn (D53). */
  getFreshUrl: (photoId: string) => Promise<string>;
}

function IconButton({ label, onClick, disabled, className, children }: {
  label: string; onClick: () => void; disabled?: boolean; className?: string; children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-30 ${className ?? ""}`}
    >
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {children}
      </svg>
    </button>
  );
}

/** Xem một ảnh phóng lớn, chuyển qua lại trong trang ảnh đang mở. Đóng bằng Esc, nút đóng hoặc bấm nền. */
export function PhotoLightbox({ photos, index, onIndexChange, onClose, getFreshUrl }: PhotoLightboxProps) {
  const { containerRef } = useFocusTrap({ isOpen: true, onClose });
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
      else if (event.key === "ArrowRight" && index < photos.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, photos.length, onIndexChange]);

  // Bấm đúng vùng nền (không phải ảnh hay nút) thì đóng.
  const closeOnBackdrop = (event: MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh hoạt động"
      tabIndex={-1}
      onClick={closeOnBackdrop}
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-xs focus:outline-none"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6" onClick={closeOnBackdrop}>
        <p className="min-w-0 text-sm [overflow-wrap:anywhere]">
          <span className="font-semibold tabular-nums">Ảnh {index + 1}/{photos.length}</span>
          <span className="text-white/75"> · {formatMeasurementDateTime(photo.uploadedAtUtc)}</span>
        </p>
        <IconButton label="Đóng" onClick={onClose}><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" /></IconButton>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-4 sm:px-20" onClick={closeOnBackdrop}>
        {/* Màn hình rộng: nút ở hai bên ảnh; điện thoại: nút nằm ở thanh dưới để không che ảnh. */}
        <IconButton label="Ảnh trước" disabled={!hasPrev} onClick={() => onIndexChange(index - 1)}
          className="absolute left-6 top-1/2 z-10 -translate-y-1/2 max-sm:hidden">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 5-7 7 7 7" />
        </IconButton>
        <SignedImage
          key={photo.id}
          src={photo.url}
          getUrl={() => getFreshUrl(photo.id)}
          alt={`Ảnh hoạt động ${index + 1}`}
          fallbackText="Không thể tải ảnh"
          className="max-h-full min-h-40 min-w-40 max-w-full rounded-lg object-contain"
        />
        <IconButton label="Ảnh sau" disabled={!hasNext} onClick={() => onIndexChange(index + 1)}
          className="absolute right-6 top-1/2 z-10 -translate-y-1/2 max-sm:hidden">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </IconButton>
      </div>

      <div className="flex items-center justify-center gap-8 pb-5 sm:hidden" onClick={closeOnBackdrop}>
        <IconButton label="Ảnh trước" disabled={!hasPrev} onClick={() => onIndexChange(index - 1)}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 5-7 7 7 7" />
        </IconButton>
        <IconButton label="Ảnh sau" disabled={!hasNext} onClick={() => onIndexChange(index + 1)}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
        </IconButton>
      </div>
    </div>
  );
}
