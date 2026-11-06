"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { SignedImage } from "@/components/ui/SignedImage";
import { StatusMessage } from "@/components/ui/StatusMessage";
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
  const { data, isLoading, isError, error, refetch, getFreshPhotoUrl } =
    useIncidentDetail(childId, incidentId, isOpen);

  if (photoCount <= 0) {
    return null;
  }

  const sectionId = `incident-photos-${incidentId}`;

  return (
    <div className="flex min-w-0 flex-col border-t border-border/50">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="min-h-11 self-end justify-start rounded-none px-0 py-1 text-sm font-normal text-brand-text underline underline-offset-4 hover:bg-transparent hover:opacity-80"
        onClick={onToggle}
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

          {isError && (
            <StatusMessage
              status="error"
              title={error?.message ?? "Không thể tải ảnh của sự cố này."}
              message=""
              onRetry={() => refetch()}
              className="p-3"
            />
          )}

          {!isLoading && !isError && data && (
            <>
              {data.photos.length === 0 ? (
                <StatusMessage
                  status="empty"
                  title="Sự cố chưa có ảnh đính kèm."
                  message=""
                  className="p-4"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {data.photos.map((photo, index) => (
                    <div
                      key={`${incidentId}-${photo.id}`}
                      className="group relative overflow-hidden rounded-lg border border-border bg-background"
                    >
                      <SignedImage
                        src={photo.url}
                        getUrl={() => getFreshPhotoUrl(photo.id)}
                        alt={`Ảnh sự cố của trẻ ${childFullName} - ảnh ${index + 1}`}
                        fallbackText="Không thể tải ảnh"
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
