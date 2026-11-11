import { Button } from "@/components/ui/Button";

interface HistoryRefreshNoticeProps {
  title: string;
  message?: string;
  isFetching: boolean;
  onRetry: () => void;
}

export function HistoryRefreshNotice({ title, message, isFetching, onRetry }: HistoryRefreshNoticeProps) {
  return (
    <div role="alert" className="my-2 flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-sm text-foreground">
      <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <span className="font-medium">{title}</span>{" "}
        {message} Đang hiển thị dữ liệu đã tải trước đó.
      </p>
      <Button type="button" size="sm" variant="secondary" className="min-h-11 shrink-0" disabled={isFetching} onClick={onRetry}>
        {isFetching ? "Đang tải lại..." : "Thử lại"}
      </Button>
    </div>
  );
}
