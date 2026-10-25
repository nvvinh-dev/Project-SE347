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
