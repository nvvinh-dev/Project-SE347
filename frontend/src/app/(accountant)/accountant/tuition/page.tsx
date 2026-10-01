import { PageHeader } from "@/components/layout/PageHeader";

export default function AccountantTuitionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý học phí & hóa đơn"
        description="Quản lý biểu phí, đợt thu học phí và theo dõi trạng thái thanh toán của học sinh"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Tính năng quản lý học phí, xuất hóa đơn và ghi nhận thanh toán sẽ được hoàn thiện trong các thẻ nghiệp vụ tiếp theo.
        </p>
      </div>
    </div>
  );
}