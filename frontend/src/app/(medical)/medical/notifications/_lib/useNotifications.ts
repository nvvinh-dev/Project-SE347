"use client";

import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiClient, ApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";

export interface IncidentNotification { id: string; childId?: string | null; message: string; createdAtUtc: string }
export interface NotificationPage { items: IncidentNotification[]; page: number; pageSize: number; totalCount: number }

export function useNotifications(page: number, pageSize: number, enabled = true) {
  const { user } = useAuth();
  return useApiQuery<NotificationPage>({
    queryKey: ["medical-notifications", user?.userId, page, pageSize],
    enabled: Boolean(user?.userId) && enabled,
    networkMode: "always", retry: false, staleTime: 0,
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiResponse<NotificationPage>>("/api/notifications", {
        params: { page, pageSize }, signal, timeout: 20_000,
      });
      const envelope = response.data;
      if (!envelope?.success || !envelope.data) {
        throw new ApiError(envelope?.message ?? "Không thể tải thông báo. Vui lòng thử lại.", envelope?.errors ?? null, response.status);
      }
      const data = envelope.data;
      if (data.page !== page || data.pageSize !== pageSize || !Number.isSafeInteger(data.totalCount) || data.totalCount < 0 ||
        !Array.isArray(data.items) || data.items.length > pageSize || !data.items.every((item) => item &&
          typeof item.id === "string" && Boolean(item.id) &&
          (item.childId == null || (typeof item.childId === "string" && Boolean(item.childId.trim()))) && typeof item.message === "string" &&
          typeof item.createdAtUtc === "string" && !Number.isNaN(Date.parse(item.createdAtUtc)))) {
        throw new ApiError("Dữ liệu thông báo từ máy chủ không hợp lệ. Vui lòng tải lại.", null, response.status);
      }
      return data;
    },
  });
}
