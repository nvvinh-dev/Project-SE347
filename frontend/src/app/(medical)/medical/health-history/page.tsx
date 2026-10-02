import { PageHeader } from "@/components/layout/PageHeader";

export default function MedicalHealthHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hồ sơ sức khỏe & Sự cố"
        description="Lịch sử tổng hợp các sự cố y tế, theo dõi thể chất và chăm sóc sức khỏe của trẻ"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Hồ sơ lịch sử y tế và sự cố toàn trường đang được kết nối với API backend.
        </p>
      </div>
    </div>
  );
}
