import { SignedImage } from "@/components/ui/SignedImage";
import { formatRecordTime } from "../incidents/_lib/health-incidents";
import type { SharedPhoto } from "./_lib/activity-photos";

export interface ShareResult {
  className: string;
  photos: SharedPhoto[];
}

interface ShareResultPanelProps {
  result: ShareResult;
}

export default function ShareResultPanel({ result }: ShareResultPanelProps) {
  return (
    <section
      role="status"
      className="min-w-0 space-y-4 rounded-xl border border-success-border bg-card p-4 shadow-xs sm:p-6"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-success-border bg-success-bg text-success">
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-base font-semibold text-success [overflow-wrap:anywhere]">
            Đã chia sẻ {result.photos.length} ảnh cho {result.className}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Lúc {formatRecordTime(result.photos[0].uploadedAtUtc)}. Liên kết xem ảnh có hiệu lực trong 60 phút.
          </p>
        </div>
      </div>
      <ul className="grid min-w-0 grid-cols-2 gap-3 min-[420px]:grid-cols-3 md:grid-cols-5">
        {result.photos.map((photo, index) => (
          <li
            key={photo.id}
            className="aspect-square min-w-0 overflow-hidden rounded-xl border border-border bg-background shadow-2xs"
          >
            <SignedImage
              src={photo.url}
              alt={`Ảnh đã chia sẻ ${index + 1}`}
              fallbackText="Ảnh không còn xem được"
              className="h-full w-full object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
