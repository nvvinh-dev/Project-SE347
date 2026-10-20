import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type {
  GrowthMeasurement,
  GrowthMeasurementPayload,
  SchoolChild,
} from "../_types/growth-measurements";

const requestTimeoutMs = 20_000;

const numberFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function invalidResponse(status: number): never {
  throw new ApiError("Dữ liệu phản hồi từ máy chủ không hợp lệ. Vui lòng tải lại dữ liệu.", null, status);
}

function isMeasurement(value: unknown): value is GrowthMeasurement {
  if (!value || typeof value !== "object") return false;
  const record = value as GrowthMeasurement;
  const validNumber = (number: unknown, maximum: number) => number === null || (
    typeof number === "number" && Number.isFinite(number) && number > 0 &&
    number <= maximum && Number(number.toFixed(2)) === number
  );
  return typeof record.id === "string" && Boolean(record.id) &&
    typeof record.childId === "string" && Boolean(record.childId) &&
    typeof record.measuredAtUtc === "string" &&
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(record.measuredAtUtc) &&
    Number.isFinite(Date.parse(record.measuredAtUtc)) &&
    validNumber(record.heightCm, 200) && validNumber(record.weightKg, 100) &&
    (record.heightCm !== null || record.weightKg !== null);
}

function readData<T>(response: ApiResponse<T>, status: number): T {
  if (!response || response.success !== true || response.data == null) {
    throw new ApiError(
      response?.message ?? "Không thể đọc dữ liệu từ máy chủ. Vui lòng thử lại.",
      response?.errors ?? null,
      status
    );
  }
  return response.data;
}

export async function getSchoolChildren(signal?: AbortSignal): Promise<SchoolChild[]> {
  const response = await apiClient.get<ApiResponse<SchoolChild[]>>(
    "/api/school-children",
    { signal, timeout: requestTimeoutMs }
  );
  const children = readData(response.data, response.status);
  if (!Array.isArray(children) || !children.every((child) => child &&
    typeof child.id === "string" && Boolean(child.id) && typeof child.fullName === "string" &&
    typeof child.dateOfBirth === "string" && /^\d{4}-\d{2}-\d{2}$/.test(child.dateOfBirth) &&
    (child.healthNotes === null || typeof child.healthNotes === "string"))) {
    invalidResponse(response.status);
  }
  return children;
}

export async function getGrowthMeasurements(
  childId: string,
  signal?: AbortSignal
): Promise<GrowthMeasurement[]> {
  const response = await apiClient.get<ApiResponse<GrowthMeasurement[]>>(
    `/api/children/${childId}/growth-measurements`,
    { signal, timeout: requestTimeoutMs }
  );
  const records = readData(response.data, response.status);
  if (!Array.isArray(records) || !records.every((record) => isMeasurement(record) && record.childId === childId)) {
    invalidResponse(response.status);
  }
  return records;
}

export async function createGrowthMeasurement(
  childId: string,
  payload: GrowthMeasurementPayload
): Promise<GrowthMeasurement> {
  const response = await apiClient.post<ApiResponse<GrowthMeasurement>>(
    `/api/children/${childId}/growth-measurements`,
    payload,
    { timeout: requestTimeoutMs }
  );
  const record = readData(response.data, response.status);
  if (response.status !== 201 || !isMeasurement(record) || record.childId !== childId) {
    invalidResponse(response.status);
  }
  return record;
}

export function formatDateOfBirth(dob: string): string {
  if (!dob) return "—";
  const parts = dob.split("-");
  if (parts.length !== 3) return dob;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function formatMeasurementDateTime(utcString: string): string {
  const date = new Date(utcString);
  if (Number.isNaN(date.getTime())) return "—";

  return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;
}

export function formatMeasurementNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return numberFormatter.format(value);
}

export interface ParseResult {
  isValid: boolean;
  value: number | null;
  errorMessage?: string;
}

export function parseMeasurementInput(
  raw: string | undefined | null,
  fieldType: "height" | "weight"
): ParseResult {
  const fieldLabel = fieldType === "height" ? "Chiều cao" : "Cân nặng";
  const unit = fieldType === "height" ? "cm" : "kg";
  const maxLimit = fieldType === "height" ? 200 : 100;

  if (raw === undefined || raw === null) {
    return { isValid: true, value: null };
  }

  const trimmed = raw.trim();
  if (trimmed === "") {
    return { isValid: true, value: null };
  }

  const pattern = /^\d+([.,]\d+)?$/;
  if (!pattern.test(trimmed)) {
    return {
      isValid: false,
      value: null,
      errorMessage: `${fieldLabel} chỉ được chứa các chữ số và tối đa một dấu phẩy hoặc dấu chấm thập phân.`,
    };
  }

  const separator = trimmed.includes(",") ? "," : trimmed.includes(".") ? "." : null;
  if (separator) {
    const parts = trimmed.split(separator);
    const fractionPart = parts[1];
    if (fractionPart.length > 2) {
      return {
        isValid: false,
        value: null,
        errorMessage: `${fieldLabel} chỉ được tối đa 2 chữ số thập phân.`,
      };
    }
  }

  const normalized = trimmed.replace(",", ".");
  const num = Number(normalized);

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return {
      isValid: false,
      value: null,
      errorMessage: `${fieldLabel} không hợp lệ.`,
    };
  }

  if (num <= 0) {
    return {
      isValid: false,
      value: null,
      errorMessage: `${fieldLabel} phải lớn hơn 0 ${unit}.`,
    };
  }

  if (num > maxLimit) {
    return {
      isValid: false,
      value: null,
      errorMessage: `${fieldLabel} không được quá ${maxLimit} ${unit}.`,
    };
  }

  return { isValid: true, value: num };
}
