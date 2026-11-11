"use client";

import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getGrowthMeasurements } from "@/lib/growth-measurements";
import type { GrowthMeasurement } from "@/types/health";

export const growthMeasurementsKey = (userId: string | undefined, childId: string) => [
  "medical-growth-measurements", userId, childId,
];

export function useGrowthMeasurements(childId: string, enabled = true) {
  const { user } = useAuth();
  return useApiQuery<GrowthMeasurement[]>({
    queryKey: growthMeasurementsKey(user?.userId, childId),
    queryFn: ({ signal }) => getGrowthMeasurements(childId, signal),
    enabled: Boolean(user?.userId && childId && enabled),
    networkMode: "always",
    retry: false,
    staleTime: 0,
  });
}
