import { PageHeader } from "@/components/layout/PageHeader";

export default function MedicalHealthNotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sổ lưu ý & Dị ứng"
        description="Quản lý và cập nhật danh sách tiền sử bệnh lý, dị ứng thuốc và thực phẩm của từng bé"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Sổ theo dõi dị ứng và lưu ý đặc biệt cho học sinh đang được kết nối với API backend.
        </p>
      </div>
    </div>
  );
}
