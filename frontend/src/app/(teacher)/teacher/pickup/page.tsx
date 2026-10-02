import { PageHeader } from "@/components/layout/PageHeader";

export default function PickupPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Đón trẻ buổi chiều"
        description="Xác minh thông tin người đón chính và người đón dự phòng khi trả trẻ"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Quy trình bàn giao trẻ và kiểm tra thông tin người đón đang được kết nối với API backend.
        </p>
      </div>
    </div>
  );
}
