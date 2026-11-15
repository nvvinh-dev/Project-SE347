"use client";

import { useState } from "react";
import { Paged } from "@/components/parent/health/Paged";
import { ICON_PATHS, SectionCard } from "@/components/parent/health/SectionCard";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { Button } from "@/components/ui/Button";
import { SignedImage } from "@/components/ui/SignedImage";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useParentIncidentDetail, useParentIncidents } from "@/hooks/useParentHealth";
import { formatMeasurementDateTime } from "@/lib/growth-measurements";
import type { ParentIncident } from "@/types/health";

/** Nội dung ảnh, chỉ được dựng khi đang mở: đóng lại là gỡ khỏi cây React nên query (gcTime 0) bị xóa,
 *  mở lần sau xin URL ký mới thay vì dùng lại URL cũ (D53). */
function IncidentPhotoPanel({ childId, incidentId, panelId }: { childId: string; incidentId: string; panelId: string }) {
  const detail = useParentIncidentDetail(childId, incidentId);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // Lỗi tạm thời giữ ảnh cũ; mất quyền (403/404) thì ẩn hết như các mục khác của trang.
  const hasVisibleData = detail.data !== undefined
    && detail.error?.status !== 403 && detail.error?.status !== 404;
  const preview = hasVisibleData ? detail.data?.photos.find((photo) => photo.id === previewId) : undefined;

  return (
    <div id={panelId} aria-busy={detail.isFetching}>
      {detail.isLoading ? (
        <div role="status"><StatusMessage status="loading" title="Đang tải ảnh…" className="p-4" /></div>
      ) : !hasVisibleData || !detail.data ? (
        <div role="alert">
          <StatusMessage status="error" title="Không thể tải ảnh của sự cố" message={detail.error?.message}
            onRetry={() => { void detail.refetch(); }} className="p-4" />
        </div>
      ) : (
        <>
          {detail.isError && (
            <div className="mb-3 overflow-hidden rounded-xl border border-warning-border">
              <RefreshErrorNotice className="px-3 py-2.5" message={detail.error.message}
                isFetching={detail.isFetching} onRetry={() => { void detail.refetch(); }} />
            </div>
          )}
          {detail.data.photos.length === 0 ? (
            <StatusMessage status="empty" message="Sự cố này chưa có ảnh đính kèm." className="p-4" />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {detail.data.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    aria-label={`Xem ảnh sự cố ${index + 1}`}
                    aria-pressed={previewId === photo.id}
                    onClick={() => setPreviewId((current) => (current === photo.id ? null : photo.id))}
                    className={`min-w-0 cursor-pointer overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${previewId === photo.id ? "border-brand ring-2 ring-brand/30" : "border-border"}`}
                  >
                    <SignedImage
                      src={photo.url}
                      getUrl={() => detail.getFreshPhotoUrl(photo.id)}
                      alt={`Ảnh sự cố ${index + 1}`}
                      fallbackText="Không thể tải ảnh"
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
              {preview && (
                <div className="mt-3 flex min-h-40 items-center justify-center rounded-xl bg-background p-1">
                  <SignedImage
                    key={preview.id}
                    src={preview.url}
                    getUrl={() => detail.getFreshPhotoUrl(preview.id)}
                    alt="Ảnh sự cố phóng lớn"
                    fallbackText="Không thể tải ảnh"
                    className="max-h-[70dvh] w-auto max-w-full rounded-lg object-contain"
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function IncidentPhotos({ childId, incident }: { childId: string; incident: ParentIncident }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = `incident-photos-${incident.id}`;

  return (
    // Chỉ dựng khung riêng khi đã mở ảnh; thu gọn thì chỉ còn nút.
    <div className={isOpen ? "space-y-3 rounded-lg border border-border bg-background/50 p-3" : undefined}>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="min-h-11 gap-2"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
        </svg>
        {isOpen ? "Ẩn ảnh" : `Xem ảnh (${incident.photoCount})`}
      </Button>
      {isOpen && <IncidentPhotoPanel childId={childId} incidentId={incident.id} panelId={panelId} />}
    </div>
  );
}

/** Danh sách sự cố của con, mới nhất trước (FR-INCIDENT-03). Chỉ đọc. */
export function IncidentList({ childId }: { childId: string }) {
  const incidents = useParentIncidents(childId);
  const hasVisibleData = incidents.data !== undefined
    && incidents.error?.status !== 403 && incidents.error?.status !== 404;
  const items = hasVisibleData ? incidents.data ?? [] : [];

  return (
    <SectionCard
      id="incident-heading"
      iconPath={ICON_PATHS.alert}
      tone="peach"
      title="Sự cố của bé"
      subtitle="Các sự việc xảy ra với bé tại trường, kèm ảnh nếu có"
      aside={items.length > 0 && `${items.length} sự cố`}
    >
      {incidents.isError && hasVisibleData && (
        <RefreshErrorNotice className="border-b border-warning-border px-4 py-3 sm:px-5" message={incidents.error.message}
          isFetching={incidents.isFetching} onRetry={() => { void incidents.refetch(); }} />
      )}
      <div aria-busy={incidents.isFetching}>
        {incidents.isLoading ? (
          <div role="status"><StatusMessage status="loading" title="Đang tải danh sách sự cố…" /></div>
        ) : !hasVisibleData ? (
          <div role="alert" className="p-4 sm:p-5">
            <StatusMessage status="error" title="Không thể tải danh sách sự cố" message={incidents.error?.message}
              onRetry={() => { void incidents.refetch(); }} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 sm:p-5">
            <StatusMessage status="empty" title="Bé chưa có sự cố nào" message="Khi có sự cố xảy ra, nhà trường sẽ ghi nhận và hiện ở đây." />
          </div>
        ) : (
          <Paged items={items} pageSize={5}>
            {(rows) => (
              <ul className="space-y-3 p-3 sm:p-4">
                {rows.map((incident) => (
                  <li key={incident.id} className="overflow-hidden rounded-xl border border-border border-l-4 border-l-peach bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-background/40 px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-peach-border bg-peach-bg px-2.5 py-1 text-xs font-medium text-orange-800">
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                        Sự cố
                      </span>
                      <time dateTime={incident.occurredAtUtc} className="text-xs font-medium tabular-nums text-foreground/80">
                        {formatMeasurementDateTime(incident.occurredAtUtc)}
                      </time>
                    </div>
                    <div className="space-y-3 px-4 py-3.5">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">{incident.description}</p>
                      {incident.photoCount > 0 && <IncidentPhotos childId={childId} incident={incident} />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Paged>
        )}
      </div>
    </SectionCard>
  );
}
