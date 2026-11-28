import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import { ATTENDANCE_STATUS_LABELS, type AttendanceResponse, type CheckInRequest } from "@/types/attendance";

export interface BatchAttendanceResult {
  childId: string;
  alreadyCheckedIn: boolean;
  attendance: AttendanceResponse;
}

export async function checkInBatch(items: CheckInRequest[]): Promise<BatchAttendanceResult[]> {
  const response = await apiClient.post<ApiResponse<BatchAttendanceResult[]>>("/api/attendances/batch", { items });
  const results = response.data?.data;
  if (response.status !== 200 || !response.data?.success || !Array.isArray(results) ||
    results.length !== items.length || !results.every((result, index) => {
      const child = items[index];
      const record = result?.attendance;
      return result?.childId === child.childId && typeof result.alreadyCheckedIn === "boolean" &&
        record?.childId === child.childId && Boolean(record.id && record.childFullName) &&
        /^\d{4}-\d{2}-\d{2}$/.test(record.attendanceDate) &&
        Number.isFinite(Date.parse(record.checkInTimeUtc)) &&
        Object.hasOwn(ATTENDANCE_STATUS_LABELS, record.status) &&
        (result.alreadyCheckedIn || record.status === child.status);
    })) {
    throw new ApiError("Chưa xác định được kết quả điểm danh. Vui lòng kiểm tra lại điểm danh hôm nay.", null, null);
  }
  return results;
}
