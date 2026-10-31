"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { SignedImage } from "@/components/ui/SignedImage";
import { getIncident, recordKeys, type IncidentRecord } from "./_lib/health-incidents";

export default function IncidentPhotos({
  record,
  userId,
  hideEmpty = false,
}: {
  record: IncidentRecord;
  userId: string;
  hideEmpty?: boolean;
}) {
  const client = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const photo = record.photos.find((item) => item.id === expanded);

  if (hideEmpty && !record.photos.length) {
    return null;
  }

  async function refreshUrl(photoId: string) {
    const updated = await client.fetchQuery({
      queryKey: recordKeys.incident(userId, record.id),
      queryFn: ({ signal }) => getIncident(record.id, record.childId, signal),
      staleTime: 0,
      retry: false,
    });
    const match = updated.photos.find((item) => item.id === photoId);
    if (!match) throw new Error("Không tìm thấy ảnh trong sự cố.");
    return match.url;
  }

  return (
    <section aria-label="Ảnh minh chứng" className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <label className="text-xs font-semibold text-foreground">
          Ảnh minh chứng đã lưu
          <span className="ml-1.5 font-normal text-muted">
            ({record.photos.length}/5 ảnh)
          </span>
        </label>
        {record.photos.length > 0 && (
          <span className="text-[11px] text-muted">Bấm vào ảnh để xem lớn</span>
        )}
      </div>

      {!record.photos.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/30 p-5 text-center">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-background text-muted">
            <svg
              className="h-4.5 w-4.5 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-xs font-medium text-muted">Sự cố chưa có ảnh đính kèm</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {record.photos.map((item, index) => {
            const isViewing = expanded === item.id;
            return (
              <Button variant="ghost" size="sm"
                key={item.id}
                type="button"
                aria-label={`Xem ảnh sự cố ${index + 1}`}
                aria-expanded={isViewing}
                aria-controls={`incident-photo-preview-${record.id}`}
                className={`group relative h-20 w-20 overflow-hidden rounded-lg border bg-card p-0 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 ${
                  isViewing
                    ? "border-brand ring-2 ring-brand/20 shadow-xs"
                    : "border-border hover:border-brand-border hover:shadow-2xs"
                }`}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setExpanded(isViewing ? null : item.id);
                }}
              >
                <SignedImage
                  src={item.url}
                  getUrl={() => refreshUrl(item.id)}
                  alt={`Ảnh sự cố ${index + 1}`}
                  fallbackText="Không tải được ảnh"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute bottom-1 right-1 rounded bg-foreground/70 px-1 py-0.2 text-[9px] font-semibold text-card">
                  #{index + 1}
                </span>
              </Button>
            );
          })}
        </div>
      )}

      {photo && (
        <div
          id={`incident-photo-preview-${record.id}`}
          className="space-y-2 rounded-xl border border-border bg-card p-3 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              Ảnh phóng lớn ({record.photos.findIndex((p) => p.id === photo.id) + 1}/{record.photos.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs text-muted hover:text-foreground"
              onClick={() => {
                setExpanded(null);
                requestAnimationFrame(() => opener.current?.focus());
              }}
            >
              Thu gọn
            </Button>
          </div>
          <div className="relative flex min-h-40 max-h-[50dvh] w-full items-center justify-center overflow-hidden rounded-lg bg-background border border-border/80 p-1">
            <SignedImage
              key={photo.id}
              src={photo.url}
              getUrl={() => refreshUrl(photo.id)}
              alt="Ảnh sự cố phóng lớn"
              fallbackText="Không tải được ảnh"
              className="max-h-[48dvh] w-auto max-w-full rounded object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
