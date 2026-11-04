"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import IncidentPhotos from "./IncidentPhotos";
import {
  formatRecordTime,
  formatTemperatureCelsius,
  getIncident,
  getQuickHealth,
  MOOD_META,
  type IncidentRecord,
  type QuickHealthRecord,
  type RecentRecordItem,
} from "./_lib/health-incidents";

export default function RecordDetailModal({
  item,
  userId,
  onClose,
}: {
  item: RecentRecordItem | null;
  userId: string;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { containerRef: dialogRef } = useFocusTrap({
    isOpen: Boolean(item),
    onClose,
    initialFocusRef: closeButtonRef,
  });
  const detail = useApiQuery<QuickHealthRecord | IncidentRecord>({
    queryKey: ["teacher-record-detail", userId, item?.type, item?.id],
    queryFn: ({ signal }) => {
      if (!item) throw new Error("Chưa chọn bản ghi.");
      return item.type === "health"
        ? getQuickHealth(item.id, item.childId, signal)
        : getIncident(item.id, item.childId, signal);
    },
    enabled: Boolean(item),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  if (!item) return null;

  const isHealth = item.type === "health";
  const ready = !detail.isPending && !detail.isFetching && !detail.isError;
  const healthRecord = ready && isHealth ? (detail.data as QuickHealthRecord) : null;
  const incidentRecord = ready && !isHealth ? (detail.data as IncidentRecord) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-3 backdrop-blur-xs sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="flex max-h-[calc(100dvh-2rem)] w-full min-w-0 max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-border p-4 sm:p-5">
          <div className="min-w-0 flex-1 space-y-1 pr-2">
            <div className="flex flex-wrap items-center gap-2">
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
            <h3 id="record-detail-title" className="wrap-anywhere text-base font-bold text-foreground">
              {detail.data?.childFullName ?? item.childFullName}
            </h3>
          </div>

          <Button
            variant="ghost"
            ref={closeButtonRef}
            type="button"
            aria-label="Đóng cửa sổ chi tiết"
            onClick={onClose}
            className={
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background " +
              "hover:text-foreground cursor-pointer transition-colors"
            }
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm">
          {(detail.isPending || detail.isFetching) ? (
            <StatusMessage status="loading" title="Đang tải chi tiết bản ghi..." />
          ) : detail.isError ? (
            <StatusMessage status="error" title="Không thể xem bản ghi" message={detail.error.message} onRetry={() => void detail.refetch()} />
          ) : !detail.data ? (
            <StatusMessage status="empty" title="Không có dữ liệu bản ghi" />
          ) : null}
          {isHealth && healthRecord && (
            <div className="space-y-4">
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
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
                    {formatTemperatureCelsius(healthRecord.temperatureCelsius)}
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

        <div className="flex shrink-0 items-center justify-end border-t border-border p-4 bg-card">
          <Button variant="secondary" onClick={onClose} className="min-h-10 px-5">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
