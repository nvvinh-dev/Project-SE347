"use client";

import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import { useQueryClient } from "@tanstack/react-query";
import type { IncidentDetailResponse } from "./types";

export const incidentDetailQueryKey = (
  userId: string | undefined,
  childId: string | null | undefined,
  incidentId: string | null | undefined
) => ["medical-incident", userId, childId, incidentId];

function validateIncidentDetail(
  data: unknown,
  expectedIncidentId: string,
  expectedChildId: string
): data is IncidentDetailResponse {
  if (!data || typeof data !== "object") return false;
  const item = data as Record<string, unknown>;

  if (item.id !== expectedIncidentId || item.childId !== expectedChildId) {
    return false;
  }
  if (typeof item.description !== "string" || typeof item.occurredAtUtc !== "string") {
    return false;
  }
  if (Number.isNaN(Date.parse(item.occurredAtUtc))) {
    return false;
  }
  if (!Array.isArray(item.photos)) return false;

  return item.photos.every(
    (photo) =>
      photo &&
      typeof photo === "object" &&
      typeof photo.id === "string" &&
      Boolean(photo.id.trim()) &&
      typeof photo.url === "string" &&
      Boolean(photo.url.trim())
  );
}

// Bảng phối hợp request làm mới ảnh đang bay để tránh gửi trùng lặp khi nhiều ảnh cùng hết hạn
const inFlightRefreshes = new Map<string, Promise<IncidentDetailResponse>>();

export async function fetchFreshIncidentDetail(
  incidentId: string,
  childId: string,
  signal?: AbortSignal
): Promise<IncidentDetailResponse> {
  const existingPromise = inFlightRefreshes.get(incidentId);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    try {
      const response = await apiClient.get<ApiResponse<IncidentDetailResponse>>(
        `/api/incidents/${incidentId}`,
        {
          signal,
          timeout: 20_000,
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );

      const envelope = response.data;
      if (!envelope || envelope.success !== true || envelope.data == null) {
        throw new ApiError(
          envelope?.message ?? "Không thể đọc dữ liệu sự cố từ máy chủ.",
          envelope?.errors ?? null,
          response.status
        );
      }

      const data = envelope.data;
      if (!validateIncidentDetail(data, incidentId, childId)) {
        throw new ApiError(
          "Dữ liệu chi tiết sự cố không hợp lệ hoặc không thuộc về trẻ đang chọn.",
          null,
          response.status
        );
      }

      return data;
    } finally {
      inFlightRefreshes.delete(incidentId);
    }
  })();

  inFlightRefreshes.set(incidentId, promise);
  return promise;
}

export function useIncidentDetail(
  childId: string | null,
  incidentId: string | null,
  isOpen: boolean
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useApiQuery<IncidentDetailResponse>({
    queryKey: incidentDetailQueryKey(user?.userId, childId, incidentId),
    queryFn: ({ signal }) => {
      if (!childId || !incidentId) {
        throw new ApiError("Thiếu định danh sự cố hoặc trẻ.", null, 400);
      }
      return fetchFreshIncidentDetail(incidentId, childId, signal);
    },
    enabled: Boolean(user?.userId && childId && incidentId && isOpen),
    networkMode: "always",
    retry: false,
    staleTime: 60_000,
  });

  // Hàm cung cấp cho prop getUrl của SignedImage: luôn gửi request mới qua backend
  const getFreshPhotoUrl = async (photoId: string): Promise<string> => {
    if (!childId || !incidentId) {
      throw new Error("Không đủ thông tin để làm mới liên kết ảnh.");
    }

    const freshDetail = await fetchFreshIncidentDetail(incidentId, childId);

    // Đồng bộ lại dữ liệu chi tiết vào bộ nhớ đệm
    queryClient.setQueryData(
      incidentDetailQueryKey(user?.userId, childId, incidentId),
      freshDetail
    );

    const targetPhoto = freshDetail.photos.find((p) => p.id === photoId);
    if (!targetPhoto?.url) {
      throw new Error("Không tìm thấy liên kết mới cho ảnh này.");
    }

    return targetPhoto.url;
  };

  return {
    ...query,
    getFreshPhotoUrl,
  };
}
