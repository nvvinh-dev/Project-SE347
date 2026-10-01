import { PageHeader } from "@/components/layout/PageHeader";

export default function ParentDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan Phụ huynh"
        description="Cổng thông tin theo dõi học tập, sinh hoạt và sức khỏe của bé tại trường"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Bảng điều khiển thông tin nhanh của bé sẽ được hoàn thiện trong các thẻ nghiệp vụ tiếp theo.
        </p>
      </div>
    </div>
  );
}