import type { SchoolChild } from "@/types/health";

export type HealthMood = "Happy" | "Normal" | "Tired" | "Fussy";

export const MOOD_LABELS: Record<string, string> = {
  Happy: "Vui vẻ",
  Normal: "Bình thường",
  Tired: "Mệt",
  Fussy: "Quấy khóc",
};

export function getMoodLabel(mood: string): string {
  return MOOD_LABELS[mood] ?? mood;
}

export interface IncidentHistoryItem {
  type: "Incident";
  id: string;
  occurredAtUtc: string;
  description: string;
  photoCount: number;
}

export interface QuickHealthStatusHistoryItem {
  type: "QuickHealthStatus";
  id: string;
  occurredAtUtc: string;
  mood: string;
  temperatureCelsius: number | null;
  notes: string;
}

export interface GrowthMeasurementHistoryItem {
  type: "GrowthMeasurement";
  id: string;
  occurredAtUtc: string;
  heightCm: number | null;
  weightKg: number | null;
}

export type HealthHistoryItem =
  | IncidentHistoryItem
  | QuickHealthStatusHistoryItem
  | GrowthMeasurementHistoryItem;

export interface HealthHistoryData {
  child: SchoolChild;
  items: HealthHistoryItem[];
}

export interface IncidentPhoto {
  id: string;
  url: string;
}

export interface IncidentDetailResponse {
  id: string;
  childId: string;
  childFullName: string;
  occurredAtUtc: string;
  description: string;
  photos: IncidentPhoto[];
}
