import { MOOD_LABELS, type HealthMood, type SchoolChild } from "@/types/health";

export function getMoodLabel(mood: HealthMood): string {
  return MOOD_LABELS[mood];
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
  mood: HealthMood;
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
