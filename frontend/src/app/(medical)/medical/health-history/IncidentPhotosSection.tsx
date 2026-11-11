"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SignedImage } from "@/components/ui/SignedImage";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { HistoryRefreshNotice } from "./HistoryRefreshNotice";
import { useIncidentDetail } from "./_lib/useIncidentDetail";

interface IncidentPhotosSectionProps {
  childId: string;
  childFullName: string;
  incidentId: string;
  photoCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function IncidentPhotosSection({
  childId,
  childFullName,
  incidentId,
  photoCount,
  isOpen,
  onToggle,
}: IncidentPhotosSectionProps) {
  // Chỉ truy vấn chi tiết sự cố khi người dùng bấm mở
  const { data, isLoading, isFetching, isError, error, refetch, getFreshPhotoUrl } =
    useIncidentDetail(childId, incidentId, isOpen);
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const expandedPhoto = data?.photos.find((photo) => photo.id === expandedPhotoId);

  if (photoCount <= 0) {
    return null;
  }

  const sectionId = `incident-photos-${incidentId}`;
  const previewId = `${sectionId}-preview`;

  return (
    <div className="flex min-w-0 flex-col border-t border-border/50">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="min-h-11 self-end justify-start rounded-none px-0 py-1 text-sm font-normal text-brand-text underline underline-offset-4 hover:bg-transparent hover:opacity-80"
        onClick={() => {
          setExpandedPhotoId(null);
          onToggle();
        }}
        aria-expanded={isOpen}
        aria-controls={sectionId}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8" cy="8" r="1.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
        </svg>
        {isOpen ? `Ẩn ảnh đính kèm (${photoCount} ảnh)` : `Xem ảnh đính kèm (${photoCount} ảnh)`}
      </Button>

      {isOpen && (
        <div id={sectionId} className="mt-1">
          {isLoading && (
            <StatusMessage
              status="loading"
              title="Đang tải danh sách ảnh sự cố..."
              className="p-4"
            />
          )}

          {isError && !data && (
            <StatusMessage
              status="error"
              title={error?.message ?? "Không thể tải ảnh của sự cố này."}
              message=""
              onRetry={() => refetch()}
              className="p-3"
            />
          )}

          {isError && data && (
            <HistoryRefreshNotice
              title="Chưa thể cập nhật ảnh sự cố."
              message={error?.message}
              isFetching={isFetching}
              onRetry={() => { void refetch(); }}
            />
          )}

          {data && (
            <>
              {data.photos.length === 0 ? (
                <StatusMessage
                  status="empty"
                  title="Sự cố chưa có ảnh đính kèm."
                  message=""
                  className="p-4"
                />
              ) : (
                <>
                  <p className="mb-2 text-xs text-muted">Bấm vào ảnh để xem lớn</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {data.photos.map((photo, index) => (
                      <Button
                        key={photo.id}
                        type="button"
                        variant="secondary"
                        className={`group relative min-h-11 min-w-0 overflow-hidden !p-0 ${expandedPhotoId === photo.id ? "ring-2 ring-brand/40" : ""}`}
                        aria-label={`Xem ảnh sự cố ${index + 1} của trẻ ${childFullName}`}
                        aria-expanded={expandedPhotoId === photo.id}
                        aria-controls={previewId}
                        onClick={(event) => {
                          openerRef.current = event.currentTarget;
                          setExpandedPhotoId((current) => current === photo.id ? null : photo.id);
                        }}
                      >
                        <SignedImage
                          src={photo.url}
                          getUrl={() => getFreshPhotoUrl(photo.id)}
                          alt={`Ảnh sự cố của trẻ ${childFullName} - ảnh ${index + 1}`}
                          fallbackText="Không thể tải ảnh"
                          className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </Button>
                    ))}
                  </div>
                  {expandedPhoto && (
                    <section id={previewId} aria-label="Ảnh sự cố phóng lớn" className="mt-3 min-w-0 space-y-2 rounded-xl border border-border bg-card p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted">
                          Ảnh phóng lớn ({data.photos.findIndex((photo) => photo.id === expandedPhoto.id) + 1}/{data.photos.length})
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="min-h-11"
                          onClick={() => {
                            setExpandedPhotoId(null);
                            openerRef.current?.focus();
                          }}
                        >
                          Thu gọn
                        </Button>
                      </div>
                      <div className="flex min-h-40 min-w-0 items-center justify-center rounded-lg bg-background p-1">
                        <SignedImage
                          key={expandedPhoto.id}
                          src={expandedPhoto.url}
                          getUrl={() => getFreshPhotoUrl(expandedPhoto.id)}
                          alt={`Ảnh sự cố phóng lớn của trẻ ${childFullName}`}
                          fallbackText="Không thể tải ảnh"
                          className="max-h-[70dvh] w-auto max-w-full object-contain"
                        />
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
