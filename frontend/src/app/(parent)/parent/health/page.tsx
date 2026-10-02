import { PageHeader } from "@/components/layout/PageHeader";

export default function ParentHealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sức khỏe & Sự cố"
        description="Theo dõi chỉ số phát triển, lịch sử y tế và các sự cố trong ngày của bé"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Tính năng theo dõi hồ sơ sức khỏe và các sự cố trong ngày của bé sẽ được hoàn thiện trong các thẻ nghiệp vụ tiếp theo.
        </p>
      </div>
    </div>
  );
}