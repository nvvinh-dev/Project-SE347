import { PageHeader } from "@/components/layout/PageHeader";

export default function ParentTuitionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông tin học phí"
        description="Xem thông báo học phí và tra cứu lịch sử hóa đơn của bé (nộp trực tiếp tại trường theo quy định)"
      />
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand mb-4">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-text-primary">Chức năng đang được xây dựng</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Tính năng tra cứu hóa đơn học phí sẽ được phát triển trong thẻ FR-TUITION-05 (tuân thủ quy định D21: phụ huynh không có nút thanh toán trực tuyến).
        </p>
      </div>
    </div>
  );
}