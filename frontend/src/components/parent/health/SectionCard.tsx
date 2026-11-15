import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionTone = "brand" | "info" | "peach";

const ICON_TONES: Record<SectionTone, string> = {
  brand: "bg-brand-subtle text-brand-text border-brand-border",
  info: "bg-info-bg text-info-text border-info-border",
  peach: "bg-peach-bg text-peach border-peach-border",
};

interface SectionCardProps {
  id: string;
  /** Đường vẽ (thuộc tính `d` của svg 24x24) cho biểu tượng đầu mục. */
  iconPath: string;
  tone?: SectionTone;
  title: string;
  subtitle?: string;
  /** Góc phải tiêu đề, ví dụ số lượng bản ghi. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Khung một mục nội dung: tiêu đề có biểu tượng + phụ đề, thân nền sáng để các thẻ con nổi lên. */
export function SectionCard({ id, iconPath, tone = "brand", title, subtitle, aside, className, children }: SectionCardProps) {
  return (
    <section aria-labelledby={id} className={cn("min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-xs", className)}>
      <header className="flex items-center gap-3 border-b border-border bg-background/40 px-4 py-4 sm:px-5">
        <span aria-hidden="true" className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", ICON_TONES[tone])}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={id} className="text-base font-semibold text-foreground [overflow-wrap:anywhere]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted sm:text-sm">{subtitle}</p>}
        </div>
        {aside && <div className="shrink-0 text-xs tabular-nums text-muted sm:text-sm">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

/** Đường vẽ biểu tượng dùng chung cho các mục của trang. */
export const ICON_PATHS = {
  heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  pulse: "M3 12h4l2.5-6 4 12 2.5-6H21",
  ruler: "M4 17 17 4l3 3L7 20H4v-3zm4-4 2 2m1-5 2 2m-7 1 1 1",
  alert: "M12 9v3m0 4h.01M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
} as const;
