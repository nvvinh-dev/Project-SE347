import { HealthHistoryScreen } from "./HealthHistoryScreen";

export default async function MedicalHealthHistoryPage({ searchParams }: {
  searchParams: Promise<{ studentId?: string | string[] }>;
}) {
  const { studentId } = await searchParams;
  return <HealthHistoryScreen key={typeof studentId === "string" ? studentId : ""}
    initialStudentId={typeof studentId === "string" ? studentId : ""} />;
}
