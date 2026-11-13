import { NotificationsScreen } from "./NotificationsScreen";
import { Suspense } from "react";
import { StatusMessage } from "@/components/ui/StatusMessage";

export default function MedicalNotificationsPage() {
  return <Suspense fallback={<StatusMessage status="loading" title="Đang tải hộp thư..." />}>
    <NotificationsScreen />
  </Suspense>;
}
