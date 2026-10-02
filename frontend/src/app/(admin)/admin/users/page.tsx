import { PageHeader } from "@/components/layout/PageHeader";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tài khoản"
        description="Danh sách người dùng và phân quyền 5 vai trò hệ thống"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-muted">
          Đang chờ kết nối API quản lý tài khoản và phân quyền ([FE][FR-USER-01/02]).
        </p>
      </div>
    </div>
  );
}
