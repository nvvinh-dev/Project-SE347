import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MockBankNotice } from "@/components/parent/tuition/MockBankNotice";
import { MockBankTransfer } from "@/components/parent/tuition/MockBankTransfer";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { MOCK_BANK_ENABLED } from "@/lib/tuition";

// D57: màn hình chỉ tồn tại khi bật cờ; backend vẫn là chốt chặn thật (404 ngoài Development).
// notFound() chỉ đổi giao diện; HTTP 404 thật khi tắt cờ do rewrite trong next.config.ts
// (layout phụ huynh là client component nên Next đã gửi 200 trước khi notFound chạy).

export default function MockBankPage() {
  if (!MOCK_BANK_ENABLED) notFound();

  return (
    <div className="mx-auto min-w-0 max-w-2xl space-y-5">
      <PageHeader
        title="Ngân hàng giả lập"
        description="Chuyển khoản học phí thử cho nhà trường để xem hóa đơn được đối soát"
      />
      <MockBankNotice />
      <section aria-label="Chuyển khoản" className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        <Suspense fallback={<StatusMessage status="loading" title="Đang tải…" />}>
          <MockBankTransfer />
        </Suspense>
      </section>
    </div>
  );
}
