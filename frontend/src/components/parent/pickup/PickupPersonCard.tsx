"use client";

import type { ReactNode } from "react";
import { SignedImage } from "@/components/ui/SignedImage";
import { fetchFreshFaceUrl } from "@/hooks/useParentPickupPersons";
import type { PickupPersonResponse } from "@/types/pickup";

interface PickupPersonCardProps {
  childId: string;
  person: PickupPersonResponse;
  /** Nút Sửa / Xóa. Người đón chính không bao giờ nhận nút Xóa (D24, D40 mục 1). */
  actions: ReactNode;
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/** Thông tin một người đón đã đăng ký; ảnh xin URL ký qua API và xin lại khi hết hạn (D53). */
export function PickupPersonCard({ childId, person, actions }: PickupPersonCardProps) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        <div className="mx-auto h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-border bg-background sm:mx-0 sm:h-32 sm:w-32">
          {/* key theo đường dẫn file (bỏ chữ ký) để đổi ảnh thì dựng lại, còn làm mới URL thì giữ nguyên ảnh. */}
          <SignedImage
            key={person.facePhotoUrl.split("?")[0]}
            src={person.facePhotoUrl}
            getUrl={() => fetchFreshFaceUrl(childId, person.id)}
            alt={`Ảnh khuôn mặt của ${person.fullName}`}
            fallbackText="Không thể tải ảnh"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-lg font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">{person.fullName}</p>
            <span className="mt-1 inline-block max-w-full rounded-full border border-brand-border bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand-text [overflow-wrap:anywhere]">
              {person.relationship}
            </span>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Info label="Số điện thoại">{person.phoneNumber}</Info>
            <Info label="Số CCCD">{person.citizenIdNumber}</Info>
          </dl>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">{actions}</div>
    </div>
  );
}
