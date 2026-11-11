"use client";

import { useCallback, useState } from "react";
import { SchoolClosureForm, type SentClosure } from "@/components/accountant/notifications/SchoolClosureForm";
import { SuccessToast, type ToastMessage } from "@/components/accountant/SuccessToast";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AccountantNotificationsPage() {
  const [lastSent, setLastSent] = useState<SentClosure | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const handleSent = (result: SentClosure) => {
    setLastSent(result);
    // Không ai nhận thì báo ở khung "Lần gửi vừa rồi" (màu cảnh báo), không hiện popup thành công.
    if (result.recipientCount > 0) {
      // recipientCount là số tài khoản Phụ huynh đang hoạt động của toàn trường lúc gửi (D39 mục 6).
      setToast({
        id: result.sentAt,
        text: `Đã gửi thông báo nghỉ học tới toàn bộ phụ huynh (${result.recipientCount} tài khoản đang hoạt động).`,
      });
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Thông báo nghỉ học"
        description="Phát thông báo nghỉ học đột xuất hoặc kế hoạch nghỉ đến toàn bộ phụ huynh học sinh"
      />
      <SchoolClosureForm lastSent={lastSent} onSent={handleSent} />
      <SuccessToast toast={toast} onClose={hideToast} />
    </div>
  );
}
