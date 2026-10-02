import { PageHeader } from "@/components/layout/PageHeader";

export default function MedicalNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông báo sự cố"
        description="Danh sách thông báo nhận khi giáo viên ghi nhận sự cố sức khỏe mới của trẻ"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Hộp thư thông báo và cảnh báo sự cố sức khỏe đang được kết nối với API backend.
        </p>
      </div>
    </div>
  );
}
