import { PageHeader } from "@/components/layout/PageHeader";

export default function ParentPhotosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho ảnh hoạt động"
        description="Hình ảnh sinh hoạt, vui chơi và học tập của bé được giáo viên ghi lại"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Tính năng xem hình ảnh hoạt động của bé tại trường sẽ được hoàn thiện trong các thẻ nghiệp vụ tiếp theo.
        </p>
      </div>
    </div>
  );
}