"use client";

import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type { HealthHistoryData, HealthHistoryItem } from "./types";

export const healthHistoryQueryKey = (
  userId: string | undefined,
  childId: string | null | undefined
) => ["medical-health-history", userId, childId];

function validateHealthHistoryItem(item: unknown): item is HealthHistoryItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Record<string, unknown>;

  if (typeof candidate.id !== "string" || !candidate.id) return false;
  if (typeof candidate.occurredAtUtc !== "string") return false;

  if (candidate.type === "Incident") {
    return (
      typeof candidate.description === "string" &&
      typeof candidate.photoCount === "number" &&
      candidate.photoCount >= 0
    );
  }

  if (candidate.type === "QuickHealthStatus") {
    const validTemp =
      candidate.temperatureCelsius === null ||
      (typeof candidate.temperatureCelsius === "number" &&
        Number.isFinite(candidate.temperatureCelsius));
    return (
      typeof candidate.mood === "string" &&
      typeof candidate.notes === "string" &&
      validTemp
    );
  }

  if (candidate.type === "GrowthMeasurement") {
    const validHeight =
      candidate.heightCm === null ||
      (typeof candidate.heightCm === "number" &&
        Number.isFinite(candidate.heightCm));
    const validWeight =
      candidate.weightKg === null ||
      (typeof candidate.weightKg === "number" &&
        Number.isFinite(candidate.weightKg));
    return validHeight && validWeight;
  }

  return false;
}

export async function fetchHealthHistory(
  childId: string,
  signal?: AbortSignal
): Promise<HealthHistoryData> {
  const response = await apiClient.get<ApiResponse<HealthHistoryData>>(
    `/api/school-children/${childId}/health-history`,
    { signal, timeout: 20_000 }
  );

  const envelope = response.data;
  if (!envelope || envelope.success !== true || envelope.data == null) {
    throw new ApiError(
      envelope?.message ?? "Không thể đọc dữ liệu từ máy chủ. Vui lòng thử lại.",
      envelope?.errors ?? null,
      response.status
    );
  }

  const { child, items } = envelope.data;

  // Bắt buộc đối chiếu đúng trẻ đang chọn để chống hiển thị nhầm dữ liệu
  if (
    !child ||
    typeof child !== "object" ||
    child.id !== childId ||
    typeof child.fullName !== "string" ||
    typeof child.dateOfBirth !== "string" ||
    (child.healthNotes !== null && typeof child.healthNotes !== "string")
  ) {
    throw new ApiError(
      "Dữ liệu hồ sơ trẻ trả về từ máy chủ không hợp lệ.",
      null,
      response.status
    );
  }

  if (!Array.isArray(items) || !items.every(validateHealthHistoryItem)) {
    throw new ApiError(
      "Dữ liệu lịch sử sức khỏe từ máy chủ không hợp lệ. Vui lòng tải lại dữ liệu.",
      null,
      response.status
    );
  }

  return { child, items };
}

export function useHealthHistory(selectedChildId: string | null) {
  const { user } = useAuth();

  return useApiQuery<HealthHistoryData>({
    queryKey: healthHistoryQueryKey(user?.userId, selectedChildId),
    queryFn: ({ signal }) => {
      if (!selectedChildId) {
        throw new ApiError("Chưa chọn trẻ để xem lịch sử.", null, 400);
      }
      return fetchHealthHistory(selectedChildId, signal);
    },
    enabled: Boolean(user?.userId && selectedChildId),
    networkMode: "always",
    retry: false,
    staleTime: 60_000,
  });
}
