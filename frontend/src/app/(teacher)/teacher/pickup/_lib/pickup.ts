import { apiClient, ApiError } from "@/lib/axios";
import { getVietnamDate } from "@/lib/attendance";
import type { ApiResponse } from "@/types/auth";
import type { CreatePickupRequest, PickupPerson, PickupRecord } from "../_types/pickup";

function readData<T>(body: ApiResponse<T>, status: number): T {
  if (!body?.success || body.data == null) {
    throw new ApiError(body?.message ?? "Không thể đọc dữ liệu đón về. Vui lòng thử lại.", body?.errors ?? null, status);
  }
  return body.data;
}

export async function getPickups(date: string, signal?: AbortSignal): Promise<PickupRecord[]> {
  const response = await apiClient.get<ApiResponse<PickupRecord[]>>("/api/pickups", { params: { date }, signal });
  const records = readData(response.data, response.status);
  if (!Array.isArray(records)) throw new ApiError("Không thể đọc danh sách đón về. Vui lòng tải lại.", null, response.status);
  return records;
}

export async function getPickupPersons(childId: string, signal?: AbortSignal): Promise<PickupPerson[]> {
  const response = await apiClient.get<ApiResponse<PickupPerson[]>>(
    `/api/homeroom-children/${encodeURIComponent(childId)}/pickup-persons`, { signal },
  );
  const persons = readData(response.data, response.status);
  if (!Array.isArray(persons) || persons.some((person) => !person.id || ![1, 2].includes(person.priority))) {
    throw new ApiError("Không thể đọc thông tin người đón. Vui lòng tải lại.", null, response.status);
  }
  return [...persons].sort((a, b) => a.priority - b.priority);
}

export async function createPickup(payload: CreatePickupRequest, date: string): Promise<PickupRecord> {
  const response = await apiClient.post<ApiResponse<PickupRecord>>("/api/pickups", payload, { timeout: 30_000 });
  const record = readData(response.data, response.status);
  const time = new Date(record.pickupTimeUtc);
  if (!record.id || !record.attendanceId || record.childId !== payload.childId ||
      !record.childFullName || !record.pickerFullName || record.pickupMethod !== payload.pickupMethod ||
      !Number.isFinite(time.getTime()) || getVietnamDate(time) !== date ||
      (payload.pickupMethod === "PhoneConfirmed" && !record.confirmedByName)) {
    throw new ApiError("Chưa xác định được kết quả ghi nhận đón về. Vui lòng tải lại dữ liệu trước khi thử lại.", null, response.status);
  }
  return record;
}

export const pickupKeys = {
  roster: (userId: string) => ["teacher-homeroom-children", userId] as const,
  attendance: (userId: string, date: string) => ["teacher-pickup-attendance", userId, date] as const,
  records: (userId: string, date: string) => ["teacher-pickups", userId, date] as const,
  persons: (userId: string, childId: string) => ["teacher-pickup-persons", userId, childId] as const,
  photo: (userId: string, childId: string) => ["teacher-pickup-photo-refresh", userId, childId] as const,
};

export function samePerson(a: PickupPerson, b: PickupPerson): boolean {
  return a.id === b.id && a.priority === b.priority && a.fullName === b.fullName &&
    a.relationship === b.relationship && a.phoneNumber === b.phoneNumber && a.citizenIdNumber === b.citizenIdNumber &&
    a.facePhotoUrl.split("?")[0] === b.facePhotoUrl.split("?")[0];
}

export function isValidPickupDate(date: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function parsePickupDate(value: string): string | undefined {
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!parts || Number(parts[3]) < 1) return undefined;
  const iso = `${parts[3]}-${parts[2]}-${parts[1]}`;
  const parsed = new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : undefined;
}
