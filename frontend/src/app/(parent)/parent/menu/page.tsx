import { PageHeader } from "@/components/layout/PageHeader";

export default function ParentMenuPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Thực đơn tuần"
        description="Xem thực đơn dinh dưỡng các bữa trong tuần của bé tại trường"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-text-primary">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Tính năng xem thực đơn tuần (chỉ đọc) sẽ được phát triển trong thẻ FR-MENU-02.
        </p>
      </div>
    </div>
  );
}