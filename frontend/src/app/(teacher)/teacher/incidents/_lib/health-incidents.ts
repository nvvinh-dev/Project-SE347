import { apiClient, ApiError, toApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";

export const MOOD_OPTIONS = [
  { value: "Happy", label: "Vui vẻ" },
  { value: "Normal", label: "Bình thường" },
  { value: "Tired", label: "Mệt mỏi" },
  { value: "Fussy", label: "Quấy khóc" },
] as const;
export type Mood = (typeof MOOD_OPTIONS)[number]["value"];
export interface QuickHealthRequest {
  childId: string;
  mood: Mood;
  temperatureCelsius: number | null;
  notes: string;
}
export interface QuickHealthRecord extends QuickHealthRequest {
  id: string;
  childFullName: string;
  recordedAtUtc: string;
}
export interface IncidentRequest {
  childId: string;
  occurredAtUtc: string;
  description: string;
}
export interface IncidentPhoto { id: string; url: string }
export interface IncidentRecord extends IncidentRequest {
  id: string;
  childFullName: string;
  photos: IncidentPhoto[];
}
export interface FormActivity { dirty: boolean; locked: boolean }
export const recordKeys = {
  health: (userId: string, id: string) => ["teacher-quick-health", userId, id] as const,
  incident: (userId: string, id: string) => ["teacher-incident", userId, id] as const,
};

const guidPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const isGuid = (value: unknown): value is string => typeof value === "string" && guidPattern.test(value);
const isText = (value: unknown): value is string => typeof value === "string" && !!value.trim();
const isDate = (value: unknown): value is string => isText(value) && Number.isFinite(Date.parse(value));
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

export function isMood(value: string): value is Mood {
  return MOOD_OPTIONS.some((option) => option.value === value);
}
function isHealthRecord(value: unknown): value is QuickHealthRecord {
  return isObject(value) && isGuid(value.id) && isGuid(value.childId) &&
    isText(value.childFullName) && isDate(value.recordedAtUtc) &&
    typeof value.mood === "string" && isMood(value.mood) && isText(value.notes) &&
    (value.temperatureCelsius === null || (typeof value.temperatureCelsius === "number" &&
      Number.isFinite(value.temperatureCelsius) && value.temperatureCelsius >= 30 && value.temperatureCelsius <= 45));
}
function isIncidentRecord(value: unknown): value is IncidentRecord {
  return isObject(value) && isGuid(value.id) && isGuid(value.childId) && isText(value.childFullName) &&
    isDate(value.occurredAtUtc) && isText(value.description) && Array.isArray(value.photos) &&
    value.photos.every((photo: unknown) => isObject(photo) && isGuid(photo.id) && isText(photo.url)) &&
    new Set(value.photos.map((photo: IncidentPhoto) => photo.id)).size === value.photos.length;
}
function readData<T>(body: ApiResponse<T>, status: number, valid: (value: unknown) => value is T): T {
  if (!body?.success || !valid(body.data)) {
    throw new ApiError(body?.message || "Không đọc được dữ liệu. Vui lòng tải lại.", body?.errors ?? null, status);
  }
  return body.data;
}

// Giữ id từ phản hồi để đối chiếu bằng GET, tránh gửi lại thao tác tạo đã có thể được lưu.
export class UncertainWriteError extends ApiError {
  constructor(public recordId: string | null) {
    super("Chưa xác định được kết quả ghi nhận. Vui lòng kiểm tra trước khi ghi tiếp.", null, null);
  }
}
function responseId(data: unknown, location: unknown, resource: string): string | null {
  if (isObject(data) && isGuid(data.id)) return data.id;
  if (typeof location !== "string") return null;
  const path = location.split("?")[0].replace(/\/$/, "");
  const prefix = `/api/${resource}/`;
  const index = path.lastIndexOf(prefix);
  const id = index >= 0 ? path.slice(index + prefix.length) : "";
  return isGuid(id) ? id : null;
}
export function isUncertainWrite(error: unknown): boolean {
  const status = toApiError(error).status;
  return status === null || status === 408 || status >= 500;
}
export async function createQuickHealth(payload: QuickHealthRequest): Promise<QuickHealthRecord> {
  const response = await apiClient.post<ApiResponse<QuickHealthRecord>>("/api/quick-health-statuses", payload);
  const record = response.data?.data;
  if (!response.data?.success || !isHealthRecord(record) || record.childId !== payload.childId ||
    record.mood !== payload.mood || record.notes !== payload.notes || record.temperatureCelsius !== payload.temperatureCelsius) {
    throw new UncertainWriteError(responseId(record, response.headers.location, "quick-health-statuses"));
  }
  return record;
}
export async function getQuickHealth(id: string, childId: string, signal?: AbortSignal): Promise<QuickHealthRecord> {
  const response = await apiClient.get<ApiResponse<QuickHealthRecord>>(`/api/quick-health-statuses/${id}`, { signal });
  const record = readData(response.data, response.status, isHealthRecord);
  if (record.id !== id || record.childId !== childId) throw new ApiError("Bản ghi không khớp trẻ đã chọn.", null, 200);
  return record;
}
export async function createIncident(payload: IncidentRequest): Promise<IncidentRecord> {
  const response = await apiClient.post<ApiResponse<IncidentRecord>>("/api/incidents", payload);
  const record = response.data?.data;
  if (!response.data?.success || !isIncidentRecord(record) || record.childId !== payload.childId ||
    record.description !== payload.description || Date.parse(record.occurredAtUtc) !== Date.parse(payload.occurredAtUtc)) {
    throw new UncertainWriteError(responseId(record, response.headers.location, "incidents"));
  }
  return record;
}
export async function getIncident(id: string, childId: string, signal?: AbortSignal): Promise<IncidentRecord> {
  const response = await apiClient.get<ApiResponse<IncidentRecord>>(`/api/incidents/${id}`, { signal });
  const record = readData(response.data, response.status, isIncidentRecord);
  if (record.id !== id || record.childId !== childId) throw new ApiError("Sự cố không khớp trẻ đã chọn.", null, 200);
  return record;
}
export function validatePhotos(files: readonly File[]): true | string {
  if (files.length > 5) return "Mỗi lần chỉ được chọn tối đa 5 ảnh. Vui lòng chọn lại cả lượt ảnh.";
  for (const [index, file] of files.entries()) {
    const number = index + 1;
    if (!["image/jpeg", "image/png"].includes(file.type) || !/\.(jpe?g|png)$/i.test(file.name)) {
      return `Ảnh thứ ${number} phải là JPEG hoặc PNG, có đuôi .jpg, .jpeg hoặc .png.`;
    }
    if (file.size <= 0) return `Ảnh thứ ${number} không được rỗng.`;
    if (file.size > 5 * 1024 * 1024) return `Ảnh thứ ${number} không được lớn hơn 5 MB.`;
  }
  return true;
}
export function validateSinglePhoto(file: File): { valid: boolean; error?: string } {
  if (!["image/jpeg", "image/png"].includes(file.type) || !/\.(jpe?g|png)$/i.test(file.name)) {
    return { valid: false, error: "Phải là JPEG hoặc PNG (.jpg, .jpeg, .png)" };
  }
  if (file.size <= 0) return { valid: false, error: "File rỗng" };
  if (file.size > 5 * 1024 * 1024) return { valid: false, error: "Lớn hơn 5 MB" };
  return { valid: true };
}
export async function attachIncidentPhotos(record: IncidentRecord, files: File[]): Promise<IncidentRecord> {
  const validation = validatePhotos(files);
  if (validation !== true) throw new ApiError(validation, null, 400);
  if (!files.length) throw new ApiError("Vui lòng chọn ít nhất 1 ảnh để đính kèm.", null, 400);
  const body = new FormData();
  files.forEach((file) => body.append("photos", file));
  const response = await apiClient.post<ApiResponse<IncidentRecord>>(`/api/incidents/${record.id}/photos`, body, {
    // Để trình duyệt tạo boundary multipart thay vì kế thừa Content-Type JSON của client chung.
    headers: { "Content-Type": undefined },
  });
  const updated = response.data?.data;
  if (!response.data?.success || !isIncidentRecord(updated) || updated.id !== record.id ||
    updated.childId !== record.childId || !hasAttachedBatch(record, updated, files.length)) {
    throw new UncertainWriteError(record.id);
  }
  return updated;
}
export function hasAttachedBatch(before: IncidentRecord, after: IncidentRecord, count: number): boolean {
  const previousIds = new Set(before.photos.map((photo) => photo.id));
  return after.id === before.id && after.childId === before.childId &&
    before.photos.every((old) => after.photos.some((photo) => photo.id === old.id)) &&
    after.photos.filter((photo) => !previousIds.has(photo.id)).length === count;
}
export function validateNotes(value?: string): true | string {
  if (!value?.trim()) return "Vui lòng nhập nội dung, không chỉ nhập khoảng trắng.";
  return value.trim().length <= 1000 || "Nội dung không được dài quá 1000 ký tự.";
}
export function validateTemperature(value?: string): true | string {
  if (!value?.trim()) return true;
  const temperature = Number(value);
  if (!Number.isFinite(temperature) || temperature < 30 || temperature > 45) return "Nhiệt độ phải từ 30 đến 45 °C.";
  return Math.abs(temperature * 10 - Math.round(temperature * 10)) < 1e-8 || "Nhiệt độ chỉ được tối đa 1 chữ số thập phân.";
}
export function vietnamDateTime(now = new Date()): string {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
export function occurredAtUtc(value?: string): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const time = new Date(`${value}:00+07:00`);
  if (!Number.isFinite(time.getTime()) || vietnamDateTime(time) !== value) return null;
  return time.toISOString();
}
export function validateOccurredAt(value: string): true | string {
  const utc = occurredAtUtc(value);
  if (!utc) return "Vui lòng nhập thời điểm xảy ra hợp lệ.";
  return Date.parse(utc) <= Date.now() || "Thời điểm xảy ra không được sau thời điểm hiện tại.";
}
export function formatRecordTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("hour")}:${get("minute")} - ${get("day")}/${get("month")}/${get("year")}`;
}

export interface RecentRecordItem {
  id: string;
  childId: string;
  childFullName: string;
  type: "health" | "incident";
  timeUtc: string;
  summary: string;
  detail: QuickHealthRecord | IncidentRecord;
}

const EMPTY_RECORDS: RecentRecordItem[] = [];
let cachedRaw: string | null = null;
let cachedRecords: RecentRecordItem[] = EMPTY_RECORDS;

export function getServerRecentRecords(): RecentRecordItem[] {
  return EMPTY_RECORDS;
}

export function getRecentRecords(userId: string): RecentRecordItem[] {
  if (typeof window === "undefined") return EMPTY_RECORDS;
  try {
    const raw = sessionStorage.getItem(`nhatre_recent_records_${userId}`);
    if (raw === cachedRaw) return cachedRecords;
    cachedRaw = raw;
    cachedRecords = raw ? JSON.parse(raw) : EMPTY_RECORDS;
    return cachedRecords;
  } catch {
    return EMPTY_RECORDS;
  }
}

export function subscribeRecentRecords(callback: () => void): () => void {
  if (typeof window === "undefined") return () => { };
  window.addEventListener("nhatre_recent_records_updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("nhatre_recent_records_updated", callback);
    window.removeEventListener("storage", callback);
  };
}

export function saveRecentRecord(userId: string, item: RecentRecordItem): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentRecords(userId);
    const filtered = existing.filter((r) => r.id !== item.id);
    const updated = [item, ...filtered].slice(0, 30);
    const serialized = JSON.stringify(updated);
    sessionStorage.setItem(`nhatre_recent_records_${userId}`, serialized);
    cachedRaw = serialized;
    cachedRecords = updated;
    window.dispatchEvent(new Event("nhatre_recent_records_updated"));
  } catch {
    // Không làm gián đoạn luồng nếu sessionStorage bị chặn
  }
}
