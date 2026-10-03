import { PageHeader } from "@/components/layout/PageHeader";

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sức khỏe & Sự cố"
        description="Ghi nhận tình trạng sức khỏe nhanh và báo cáo sự cố phát sinh của trẻ"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Biểu mẫu ghi nhận sức khỏe nhanh và báo cáo sự cố đang được kết nối với API backend.
        </p>
      </div>
    </div>
  );
}
