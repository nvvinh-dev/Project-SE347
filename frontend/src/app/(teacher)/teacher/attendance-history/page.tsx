import { PageHeader } from "@/components/layout/PageHeader";

export default function AttendanceHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử điểm danh"
        description="Tra cứu lịch sử chuyên cần của lớp theo một trẻ hoặc theo một ngày"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Tính năng tra cứu lịch sử điểm danh của lớp đang được kết nối với API backend.
        </p>
      </div>
    </div>
  );
}
