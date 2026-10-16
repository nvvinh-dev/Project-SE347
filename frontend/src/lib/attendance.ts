import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { AttendanceHistoryFilter, AttendanceResponse, AttendanceStatus, CheckInRequest, HomeroomChildResponse } from "@/types/attendance";

function readData<T>(response: ApiResponse<T>, status: number): T {
  if (!response || !response.success || response.data == null) {
    throw new ApiError(
      response?.message ?? "Không thể đọc kết quả điểm danh. Vui lòng thử lại.",
      response?.errors ?? null,
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

export async function getHomeroomChildren(signal?: AbortSignal): Promise<HomeroomChildResponse[]> {
  const response = await apiClient.get<ApiResponse<HomeroomChildResponse[]>>(
    "/api/homeroom-children", { signal },
  );
  return readData(response.data, response.status);
}

export async function getAttendanceHistory(
  filter: AttendanceHistoryFilter,
  signal?: AbortSignal,
): Promise<AttendanceResponse[]> {
  const response = await apiClient.get<ApiResponse<AttendanceResponse[]>>(
    "/api/attendances", { params: filter, signal },
  );
  return readData(response.data, response.status);
}

export function formatAttendanceDate(date: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
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
  const record = readData(response.data, response.status);
  if (!record.id || record.childId !== childId || record.status !== status ||
      !record.attendanceDate || !record.checkInTimeUtc || !record.childFullName) {
    throw new ApiError("Chưa xác định được kết quả ghi nhận. Vui lòng tải lại điểm danh trước khi thử lại.", null, response.status);
  }
  return record;
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
