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
