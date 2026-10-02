import { PageHeader } from "@/components/layout/PageHeader";

export default function MedicalHealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Theo dõi thể chất"
        description="Ghi nhận và theo dõi các chỉ số chiều cao, cân nặng theo từng lần đo của trẻ"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Bảng theo dõi thể chất học sinh theo từng lần đo đang được kết nối với API backend.
        </p>
      </div>
    </div>
  );
}
