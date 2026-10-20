"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { SignedImage } from "@/components/ui/SignedImage";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useApiQuery } from "@/hooks/useApiQuery";
import { ApiError } from "@/lib/axios";
import { formatAttendanceTime } from "@/lib/attendance";
import type { AttendanceResponse } from "@/types/attendance";
import { getPickupPersons, pickupKeys, samePerson } from "./_lib/pickup";
import { PICKUP_METHOD_LABELS, type PickupPerson, type PickupRecord } from "./_types/pickup";
import PickupPhotoPreview from "./PickupPhotoPreview";

interface Props {
  child: AttendanceResponse;
  record?: PickupRecord;
  userId: string;
  today: boolean;
  canWrite: boolean;
  photoVersion: number;
  onChoose: (child: AttendanceResponse, persons: PickupPerson[], person: PickupPerson | null, trigger: HTMLButtonElement) => void;
}

export default function PickupChildCard({ child, record, userId, today, canWrite, photoVersion, onChoose }: Props) {
  const [previewPerson, setPreviewPerson] = useState<PickupPerson | null>(null);
  const queryClient = useQueryClient();
  const persons = useApiQuery<PickupPerson[]>({
    queryKey: pickupKeys.persons(userId, child.childId),
    queryFn: ({ signal }) => getPickupPersons(child.childId, signal),
    enabled: today && !record,
    staleTime: 60_000,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
  });
  const registered = persons.data ?? [];
  const hasPrimary = registered.some((person) => person.priority === 1);
  const ready = canWrite && !persons.isError && !persons.isFetching && hasPrimary;

  async function refreshPhoto(person: PickupPerson): Promise<string> {
    // Một truy vấn riêng cho ảnh tránh thay key của ảnh đang thử tải lại.
    const fresh = await queryClient.fetchQuery({
      queryKey: pickupKeys.photo(userId, child.childId),
      queryFn: ({ signal }) => getPickupPersons(child.childId, signal),
      staleTime: 1_000,
      gcTime: 0,
      retry: false,
    });
    const current = fresh.find((item) => item.id === person.id);
    if (!current?.facePhotoUrl || !samePerson(person, current)) {
      throw new ApiError("Không thể tải ảnh hoặc thông tin người đón đã thay đổi. Vui lòng tải lại thông tin.", null, null);
    }
    return current.facePhotoUrl;
  }

  return (
    <article aria-label={`Đón về: ${child.childFullName}`} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-subtle text-lg font-bold text-brand-text">
          {child.childFullName.trim().split(/\s+/).at(-1)?.charAt(0).toLocaleUpperCase("vi-VN")}
        </div>
        <div className="min-w-0 flex-1 basis-28">
          <h2 className="wrap-anywhere text-base font-bold text-foreground">{child.childFullName}</h2>
          <p className="mt-0.5 text-xs text-muted">{today ? "Có mặt hôm nay" : "Có mặt trong ngày đã chọn"}</p>
        </div>
        <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${record ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}>
          {record ? "Đã đón" : today ? "Chờ đón" : "Chưa ghi nhận đón về"}
        </span>
      </div>

      {record ? (
        <div className="space-y-1 rounded-lg border border-success-border bg-success-bg p-4 wrap-anywhere">
          <p className="text-sm font-semibold text-success">Đã giao cho {record.pickerFullName}</p>
          <p className="text-xs text-muted">{PICKUP_METHOD_LABELS[record.pickupMethod]} · {formatAttendanceTime(record.pickupTimeUtc)}</p>
          {record.confirmedByName && <p className="text-xs text-muted">Người xác nhận: {record.confirmedByName}</p>}
        </div>
      ) : !today ? (
        <p className="rounded-lg bg-background p-4 text-sm text-muted">Chưa có bản ghi đón về trong ngày đã chọn.</p>
      ) : persons.isError ? (
        <StatusMessage status="error" title="Không thể tải người đón" message={persons.error.message} onRetry={() => void persons.refetch()} />
      ) : persons.isPending ? (
        <StatusMessage status="loading" title="Đang tải thông tin người đón..." />
      ) : !registered.length ? (
        <StatusMessage status="empty" title="Chưa đăng ký người đón" message="Liên hệ phụ huynh đăng ký người đón chính, sau đó tải lại dữ liệu để xác minh và ghi nhận đón về." />
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold text-muted">NGƯỜI ĐÓN ĐÃ ĐĂNG KÝ</p>
          <div className="space-y-4">
            {registered.map((person) => (
              <div key={person.id} className="space-y-3 rounded-lg border border-border p-3">
                <div className="grid grid-cols-[3rem_minmax(0,1fr)] grid-rows-[auto_auto_auto_auto] items-start gap-x-2 gap-y-1 min-[375px]:grid-cols-[4rem_minmax(0,1fr)] sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-3">
                  <div className="col-start-2 row-start-1 flex min-w-0 items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 text-xs font-semibold text-foreground wrap-anywhere min-[375px]:text-sm">{person.fullName} <span className="font-normal text-muted">({person.relationship})</span></h3>
                    <span title={person.priority === 1 ? "Người đón chính" : "Người dự phòng"} className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${person.priority === 1 ? "bg-brand-subtle text-brand-text" : "bg-background text-muted"}`}>
                      <span className="min-[480px]:hidden" aria-hidden="true">{person.priority === 1 ? "Chính" : "Dự phòng"}</span>
                      <span className="sr-only min-[480px]:not-sr-only">{person.priority === 1 ? "Người đón chính" : "Người dự phòng"}</span>
                    </span>
                  </div>
                  <Button variant="ghost" aria-label={`Xem ảnh lớn của ${person.fullName}`} aria-haspopup="dialog" title="Bấm để xem ảnh lớn" onClick={() => setPreviewPerson(person)} className="relative col-start-1 row-span-4 row-start-1 h-full min-h-24 w-full cursor-zoom-in overflow-hidden rounded-lg p-0!">
                    <SignedImage
                      key={`${person.id}:${person.facePhotoUrl}:${photoVersion}`}
                      src={person.facePhotoUrl}
                      getUrl={() => refreshPhoto(person)}
                      alt={`Ảnh khuôn mặt ${person.fullName}`}
                      fallbackText="Ảnh chưa tải được"
                      className="absolute inset-0 h-full w-full rounded-lg border border-border bg-background object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                    <span aria-hidden="true" className="absolute right-1 bottom-1 rounded bg-card/90 p-0.5 text-muted">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="10" cy="10" r="6" /><path strokeLinecap="round" d="m15 15 5 5M7 10h6m-3-3v6" /></svg>
                    </span>
                  </Button>
                  <p className="col-start-2 row-start-2 min-w-0 text-xs text-muted tabular-nums wrap-anywhere">SĐT: {person.phoneNumber}</p>
                  <p className="col-start-2 row-start-3 min-w-0 text-xs text-muted tabular-nums wrap-anywhere">CCCD: {person.citizenIdNumber}</p>
                  <Button variant="outline" size="sm" disabled={!ready} className="col-start-2 row-start-4 min-h-8 max-w-full justify-self-end whitespace-normal px-2.5 py-1 text-center" onClick={(event) => onChoose(child, registered, person, event.currentTarget)}>
                    Giao cho người này
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {!hasPrimary && <p role="alert" className="mt-3 text-sm text-danger">Chưa có người đón chính. Chưa thể ghi nhận đón về.</p>}
          <Button variant="secondary" disabled={!ready} className="mt-4 min-h-11 w-full whitespace-normal text-center" onClick={(event) => onChoose(child, registered, null, event.currentTarget)}>
            Người khác đến đón — đã gọi xác nhận
          </Button>
        </>
      )}
      {previewPerson && !record && today && <PickupPhotoPreview person={previewPerson} childName={child.childFullName} getUrl={() => refreshPhoto(previewPerson)} onClose={() => setPreviewPerson(null)} />}
    </article>
  );
}
