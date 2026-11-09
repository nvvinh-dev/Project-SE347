"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface RefreshErrorNoticeProps {
  message: string;
  onRetry: () => void;
  isFetching: boolean;
  /** Dòng tóm tắt in đậm đặt trước thông báo lỗi. */
  title?: string;
  /** Khung bao ngoài (viền, bo góc, khoảng đệm) tùy vị trí đặt dải cảnh báo. */
  className?: string;
}

/** Dải cảnh báo khi tải lại lỗi nhưng vẫn còn dữ liệu cũ đang hiển thị. */
export function RefreshErrorNotice({ message, onRetry, isFetching, title, className }: RefreshErrorNoticeProps) {
  return (
    <div role="alert" className={cn("flex flex-wrap items-center justify-between gap-3 bg-warning-bg text-sm", className)}>
      <p className="min-w-0 flex-1 break-words text-foreground">
        {title && <><strong className="font-medium">{title}</strong>{" "}</>}
        {message} <span className="text-muted">Đang hiển thị dữ liệu đã tải trước đó.</span>
      </p>
      <Button size="sm" variant="secondary" disabled={isFetching} onClick={onRetry}>Thử lại</Button>
    </div>
  );
}
