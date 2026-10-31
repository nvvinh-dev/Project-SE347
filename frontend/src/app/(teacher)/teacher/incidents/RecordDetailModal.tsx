"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import IncidentPhotos from "./IncidentPhotos";
import {
  formatRecordTime,
  type IncidentRecord,
  type QuickHealthRecord,
  type RecentRecordItem,
} from "./_lib/health-incidents";

const MOOD_META: Record<string, { label: string; icon: string }> = {
  Happy: { label: "Vui vẻ", icon: "😊" },
  Normal: { label: "Bình thường", icon: "🙂" },
  Tired: { label: "Mệt mỏi", icon: "😴" },
  Fussy: { label: "Quấy khóc", icon: "😢" },
};

export default function RecordDetailModal({
  item,
  userId,
  onClose,
}: {
  item: RecentRecordItem | null;
  userId: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "a[href], button, input, select, textarea, [tabindex]"
        )
      ).filter(
        (el) =>
          el.tabIndex >= 0 &&
          !el.matches(":disabled") &&
          window.getComputedStyle(el).display !== "none"
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;

  const isHealth = item.type === "health";
  const healthRecord = isHealth ? (item.detail as QuickHealthRecord) : null;
  const incidentRecord = !isHealth ? (item.detail as IncidentRecord) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-lg overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isHealth
                    ? "bg-brand-subtle text-brand-text border border-brand-border/60"
                    : "bg-warning-bg text-warning border border-warning-border/60"
                  }`}
              >
                {isHealth ? "Sức khỏe nhanh" : "Báo cáo sự cố"}
              </span>
              <span className="text-xs text-muted truncate">
                {formatRecordTime(item.timeUtc)}
              </span>
            </div>
            <h3 id="record-detail-title" className="text-base font-bold text-foreground truncate">
              {item.childFullName}
            </h3>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Đóng cửa sổ chi tiết"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground cursor-pointer transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 text-sm">
          {isHealth && healthRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tâm trạng</label>
                  <div className="rounded-xl bg-background/50 p-3 border border-border flex items-center gap-1.5 font-medium text-muted">
                    <span className="text-xl leading-none">
                      {MOOD_META[healthRecord.mood]?.icon ?? "🙂"}
                    </span>
                    <span>{MOOD_META[healthRecord.mood]?.label ?? healthRecord.mood}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Thân nhiệt</label>
                  <div className="rounded-xl bg-background/50 p-3 border border-border font-medium text-muted min-h-[46px] flex items-center">
                    {healthRecord.temperatureCelsius !== null
                      ? `${healthRecord.temperatureCelsius} °C`
                      : "Không đo thân nhiệt"}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ghi chú quan sát sức khỏe
                </label>
                <div className="rounded-xl bg-background/50 p-3.5 border border-border">
                  <p className="whitespace-pre-wrap wrap-anywhere text-muted font-normal leading-relaxed">
                    {healthRecord.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isHealth && incidentRecord && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Thời điểm xảy ra sự cố
                </label>
                <div className="rounded-xl bg-background/50 p-3 border border-border font-medium text-muted">
                  {formatRecordTime(incidentRecord.occurredAtUtc)}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Mô tả chi tiết sự cố
                </label>
                <div className="rounded-xl bg-background/50 p-3.5 border border-border">
                  <p className="whitespace-pre-wrap wrap-anywhere text-muted font-normal leading-relaxed">
                    {incidentRecord.description}
                  </p>
                </div>
              </div>

              <IncidentPhotos record={incidentRecord} userId={userId} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border p-4 bg-card">
          <Button variant="secondary" onClick={onClose} className="min-h-10 px-5">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
