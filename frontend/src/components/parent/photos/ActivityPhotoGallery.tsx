"use client";

import { useRef, useState } from "react";
import { SectionCard } from "@/components/parent/health/SectionCard";
import { PhotoLightbox } from "@/components/parent/photos/PhotoLightbox";
import { RefreshErrorNotice } from "@/components/parent/RefreshErrorNotice";
import { Pagination } from "@/components/ui/Pagination";
import { SignedImage } from "@/components/ui/SignedImage";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { PARENT_PHOTOS_PAGE_SIZE, useParentActivityPhotos } from "@/hooks/useParentActivityPhotos";
import { formatMeasurementDate } from "@/lib/growth-measurements";
import type { ParentActivityPhoto } from "@/types/media";

const IMAGE_ICON = "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z";

/** Gom ảnh của trang hiện tại theo ngày tải lên, giữ nguyên thứ tự mới nhất trước của API. */
function groupByDay(photos: ParentActivityPhoto[]) {
  const groups: { day: string; photos: ParentActivityPhoto[] }[] = [];
  for (const photo of photos) {
    const day = formatMeasurementDate(photo.uploadedAtUtc);
    const last = groups.at(-1);
    if (last?.day === day) last.photos.push(photo);
    else groups.push({ day, photos: [photo] });
  }
  return groups;
}

/** Ảnh hoạt động của lớp con đang học, mới nhất trước, phân trang phía máy chủ (FR-MEDIA-02). Chỉ đọc. */
export function ActivityPhotoGallery({ childId }: { childId: string }) {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const photos = useParentActivityPhotos(childId, page);
  // Lỗi tạm thời giữ ảnh cũ; mất quyền (403/404) thì ẩn hết.
  const hasVisibleData = photos.data !== undefined
    && photos.error?.status !== 403 && photos.error?.status !== 404;
  const items = hasVisibleData ? photos.data?.items ?? [] : [];
  const totalCount = hasVisibleData ? photos.data?.totalCount ?? 0 : 0;
  const openIndex = items.findIndex((photo) => photo.id === openId);

  const changePage = (next: number) => {
    setPage(next);
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div ref={topRef} className="scroll-mt-4">
      <SectionCard
        id="photos-heading"
        iconPath={IMAGE_ICON}
        title="Ảnh hoạt động của lớp"
        subtitle="Khoảnh khắc sinh hoạt, vui chơi và học tập do giáo viên chia sẻ"
        aside={totalCount > 0 && `${totalCount} ảnh`}
      >
        {photos.isError && hasVisibleData && (
          <RefreshErrorNotice className="border-b border-warning-border px-4 py-3 sm:px-5" message={photos.error.message}
            isFetching={photos.isFetching} onRetry={() => { void photos.refetch(); }} />
        )}
        <div aria-busy={photos.isFetching}>
          {photos.isLoading ? (
            <div role="status"><StatusMessage status="loading" title="Đang tải ảnh hoạt động…" /></div>
          ) : !hasVisibleData ? (
            <div role="alert" className="p-4 sm:p-5">
              <StatusMessage status="error" title="Không thể tải ảnh hoạt động" message={photos.error?.message}
                onRetry={() => { void photos.refetch(); }} />
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 sm:p-5">
              <StatusMessage
                status="empty"
                title="Lớp của bé chưa có ảnh hoạt động"
                message="Khi giáo viên chia sẻ ảnh cho lớp, ảnh sẽ hiện ở đây."
              />
            </div>
          ) : (
            <div className={`space-y-6 p-4 transition-opacity sm:p-5 ${photos.isPlaceholderData ? "opacity-60" : ""}`}>
              {groupByDay(items).map((group) => (
                <section key={group.day} aria-label={`Ảnh ngày ${group.day}`}>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span aria-hidden="true" className="h-4 w-1 rounded-full bg-brand" />
                    <time>{group.day}</time>
                    <span className="text-xs font-normal text-muted">· {group.photos.length} ảnh</span>
                  </h3>
                  <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                    {group.photos.map((photo) => (
                      <li key={photo.id} className="min-w-0">
                        <button
                          type="button"
                          aria-label={`Phóng to ảnh chụp ngày ${group.day}`}
                          onClick={() => setOpenId(photo.id)}
                          className="group block aspect-4/3 w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          <SignedImage
                            src={photo.url}
                            getUrl={() => photos.getFreshPhotoUrl(photo.id)}
                            alt="Ảnh hoạt động của lớp"
                            fallbackText="Không thể tải ảnh"
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
        {hasVisibleData && totalCount > PARENT_PHOTOS_PAGE_SIZE && (
          <Pagination
            page={page}
            pageSize={PARENT_PHOTOS_PAGE_SIZE}
            totalCount={totalCount}
            onPageChange={changePage}
            className="border-t border-border px-4 py-3! sm:px-5 [&_nav]:max-w-full [&_nav]:flex-wrap"
          />
        )}
      </SectionCard>
      {openIndex >= 0 && (
        <PhotoLightbox
          photos={items}
          index={openIndex}
          onIndexChange={(next) => setOpenId(items[next].id)}
          onClose={() => setOpenId(null)}
          getFreshUrl={photos.getFreshPhotoUrl}
        />
      )}
    </div>
  );
}
