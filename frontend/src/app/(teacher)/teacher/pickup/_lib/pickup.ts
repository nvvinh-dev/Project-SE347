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

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPickupRecord(value: unknown): value is PickupRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return hasText(record.id) && hasText(record.attendanceId) && hasText(record.childId) &&
    hasText(record.childFullName) && hasText(record.pickerFullName) &&
    hasText(record.pickupTimeUtc) && Number.isFinite(new Date(record.pickupTimeUtc).getTime()) &&
    ["Primary", "Backup", "PhoneConfirmed"].includes(String(record.pickupMethod)) &&
    (record.pickupMethod === "PhoneConfirmed" ? hasText(record.confirmedByName) : record.confirmedByName == null);
}

type ReceivedPerson = Omit<PickupPerson, "facePhotoUrl"> & { facePhotoUrl?: string | null };

function isPickupPerson(value: unknown): value is ReceivedPerson {
  if (!value || typeof value !== "object") return false;
  const person = value as Record<string, unknown>;
  return hasText(person.id) && (person.priority === 1 || person.priority === 2) &&
    hasText(person.fullName) && hasText(person.relationship) &&
    hasText(person.phoneNumber) && hasText(person.citizenIdNumber) &&
    (person.facePhotoUrl == null || typeof person.facePhotoUrl === "string");
}

export async function getPickups(date: string, signal?: AbortSignal): Promise<PickupRecord[]> {
  const response = await apiClient.get<ApiResponse<PickupRecord[]>>("/api/pickups", { params: { date }, signal });
  const records = readData(response.data, response.status);
  if (!Array.isArray(records) || !records.every(isPickupRecord) ||
      records.some((record) => getVietnamDate(new Date(record.pickupTimeUtc)) !== date) ||
      new Set(records.map((record) => record.childId)).size !== records.length) {
    throw new ApiError("Không thể đọc danh sách đón về. Vui lòng tải lại.", null, response.status);
  }
  return records;
}

export async function getPickupPersons(childId: string, signal?: AbortSignal): Promise<PickupPerson[]> {
  const response = await apiClient.get<ApiResponse<PickupPerson[]>>(
    `/api/homeroom-children/${encodeURIComponent(childId)}/pickup-persons`, { signal },
  );
  const persons = readData(response.data, response.status);
  if (!Array.isArray(persons) || !persons.every(isPickupPerson) || persons.length > 2 ||
      new Set(persons.map((person) => person.id)).size !== persons.length ||
      new Set(persons.map((person) => person.priority)).size !== persons.length) {
    throw new ApiError("Không thể đọc thông tin người đón. Vui lòng tải lại.", null, response.status);
  }
  return persons.map((person) => ({ ...person, facePhotoUrl: person.facePhotoUrl ?? "" }))
    .sort((a, b) => a.priority - b.priority);
}

export async function createPickup(payload: CreatePickupRequest, date: string): Promise<PickupRecord> {
  const response = await apiClient.post<ApiResponse<PickupRecord>>("/api/pickups", payload, { timeout: 30_000 });
  const record = readData(response.data, response.status);
  if (!isPickupRecord(record) || record.childId !== payload.childId || record.pickupMethod !== payload.pickupMethod ||
      getVietnamDate(new Date(record.pickupTimeUtc)) !== date) {
    throw new ApiError("Chưa xác định được kết quả ghi nhận đón về. Vui lòng tải lại dữ liệu trước khi thử lại.", null, response.status);
  }
  return record;
}

export const pickupKeys = {
  attendance: (userId: string, date: string) => ["teacher-pickup-attendance", userId, date] as const,
  records: (userId: string, date: string) => ["teacher-pickups", userId, date] as const,
  persons: (userId: string, childId: string) => ["teacher-pickup-persons", userId, childId] as const,
  photo: (userId: string, childId: string) => ["teacher-pickup-photo-refresh", userId, childId] as const,
};

export function samePerson(a: PickupPerson, b: PickupPerson): boolean {
  return a.id === b.id && a.priority === b.priority && a.fullName === b.fullName &&
    a.relationship === b.relationship && a.phoneNumber === b.phoneNumber && a.citizenIdNumber === b.citizenIdNumber &&
    (a.facePhotoUrl ?? "").split("?")[0] === (b.facePhotoUrl ?? "").split("?")[0];
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
