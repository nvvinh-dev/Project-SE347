import { NotificationsScreen } from "./NotificationsScreen";

export default async function MedicalNotificationsPage({ searchParams }: {
  searchParams: Promise<{ notificationId?: string | string[] }>;
}) {
  const { notificationId } = await searchParams;
  return <NotificationsScreen key={typeof notificationId === "string" ? notificationId : ""}
    initialNotificationId={typeof notificationId === "string" ? notificationId : ""} />;
}
