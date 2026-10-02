import { PageHeader } from "@/components/layout/PageHeader";

export default function AccountantStudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý hồ sơ trẻ"
        description="Danh sách hồ sơ học sinh, thông tin phụ huynh và liên kết tài khoản"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Tính năng quản lý hồ sơ trẻ và liên kết phụ huynh sẽ được hoàn thiện trong các thẻ nghiệp vụ tiếp theo.
        </p>
      </div>
    </div>
  );
}