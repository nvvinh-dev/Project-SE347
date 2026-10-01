import { PageHeader } from "@/components/layout/PageHeader";

export default function AccountantDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan Kế toán"
        description="Bảng điều khiển và theo dõi công tác kế toán nhà trường"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-text-primary">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Giao diện và các chỉ số tổng quan sẽ được hoàn thiện trong các thẻ nghiệp vụ tiếp theo.
        </p>
      </div>
    </div>
  );
}