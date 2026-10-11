import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { AttendanceResponse, AttendanceStatus, CheckInRequest } from "@/types/attendance";

function readData<T>(response: ApiResponse<T>, status: number): T {
  if (!response.success || response.data === null) {
    throw new ApiError(
      response.message ?? "Không thể đọc kết quả điểm danh. Vui lòng thử lại.",
      response.errors,
      status,
    );
  }
  return response.data;
}

export async function getAttendanceForDate(
  date: string,
  signal?: AbortSignal,
): Promise<AttendanceResponse[]> {
  const response = await apiClient.get<ApiResponse<AttendanceResponse[]>>(
    "/api/attendances",
    { params: { date }, signal },
  );
  return readData(response.data, response.status);
}

export async function checkInStudent(
  childId: string,
  status: AttendanceStatus,
): Promise<AttendanceResponse> {
  const payload: CheckInRequest = { childId, status };
  const response = await apiClient.post<ApiResponse<AttendanceResponse>>(
    "/api/attendances",
    payload,
  );
  return readData(response.data, response.status);
}

export function getVietnamDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return [value("year"), value("month"), value("day")].join("-");
}

export function formatAttendanceTime(utc: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(utc));
}
