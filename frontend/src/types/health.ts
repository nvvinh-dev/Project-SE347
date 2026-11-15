export type HealthMood = "Happy" | "Normal" | "Tired" | "Fussy";

export const MOOD_LABELS: Record<HealthMood, string> = {
  Happy: "Vui vẻ",
  Normal: "Bình thường",
  Tired: "Mệt",
  Fussy: "Quấy khóc",
};

export interface SchoolChild {
  id: string;
  fullName: string;
  dateOfBirth: string;
  healthNotes: string | null;
}

export interface GrowthMeasurement {
  id: string;
  childId: string;
  measuredAtUtc: string;
  heightCm: number | null;
  weightKg: number | null;
}

export interface GrowthMeasurementFormValues {
  heightCm: string;
  weightKg: string;
}

export interface GrowthMeasurementPayload {
  heightCm: number | null;
  weightKg: number | null;
}

// DTO phía phụ huynh (FR-HEALTH-05, FR-INCIDENT-03): không có childId, không có người ghi nhận.
export interface ParentQuickHealthStatus {
  id: string;
  recordedAtUtc: string;
  mood: HealthMood;
  temperatureCelsius: number | null;
  notes: string;
}

export interface ParentGrowthMeasurement {
  id: string;
  measuredAtUtc: string;
  heightCm: number | null;
  weightKg: number | null;
}

export interface ParentHealthResponse {
  healthNotes: string | null;
  quickHealthStatuses: ParentQuickHealthStatus[];
  growthMeasurements: ParentGrowthMeasurement[];
}

export interface ParentIncident {
  id: string;
  occurredAtUtc: string;
  description: string;
  photoCount: number;
}

export interface ParentIncidentDetail extends Omit<ParentIncident, "photoCount"> {
  /** URL ký hạn 60 phút (D53) — không lưu lâu, hết hạn thì gọi lại route chi tiết. */
  photos: { id: string; url: string }[];
}
