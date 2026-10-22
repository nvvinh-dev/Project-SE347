"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { SignedImage } from "@/components/ui/SignedImage";
import type { PickupPerson } from "./_types/pickup";

interface Props {
  person: PickupPerson;
  childName: string;
  getUrl: () => Promise<string>;
  onClose: () => void;
}

export default function PickupPhotoPreview({ person, childName, getUrl, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    // Hộp thoại trình duyệt giữ focus bên trong và trả về ảnh vừa mở khi đóng.
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={(event) => {
        // Sự kiện đóng từ lần dọn dẹp trước có thể đến sau khi hộp thoại đã mở lại.
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom
        ) dialogRef.current?.close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto overscroll-contain
        rounded-2xl border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-foreground/40 backdrop:backdrop-blur-xs"
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
        <div className="min-w-0 wrap-anywhere">
          <h2 id={titleId} className="text-base font-semibold">Ảnh người đón</h2>
          <p className="mt-1 text-sm">{person.fullName} <span className="text-muted">({person.relationship})</span></p>
          <p className="mt-1 text-xs text-muted">Trẻ: {childName}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Đóng ảnh"
          title="Đóng ảnh"
          className="h-11 w-11 shrink-0 p-0"
          onClick={() => dialogRef.current?.close()}
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </Button>
      </header>
      <div className="p-4">
        <SignedImage
          src={person.facePhotoUrl}
          getUrl={getUrl}
          alt={`Ảnh khuôn mặt ${person.fullName}`}
          fallbackText="Ảnh chưa tải được"
          referrerPolicy="no-referrer"
          className="h-[min(65dvh,36rem)] max-h-[calc(100dvh-15rem)] min-h-24 w-full
            rounded-lg border border-border bg-background object-contain"
        />
      </div>
    </dialog>
  );
}
