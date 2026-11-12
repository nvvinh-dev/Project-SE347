"use client";

import { apiClient, ApiError } from "@/lib/axios";
import { useApiMutation, useApiQuery } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type {
  NotificationListQuery,
  NotificationPageResponse,
  SchoolClosureRequest,
  SchoolClosureResponse,
} from "@/types/notifications";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function notificationsKey(query?: NotificationListQuery) {
  return [...NOTIFICATIONS_QUERY_KEY, query?.page ?? 1, query?.pageSize ?? 20] as const;
}

/**
 * Hook truy vấn danh sách thông báo in-app hệ thống (FR-NOTI-01..04, D25)
 */
export function useNotifications(query?: NotificationListQuery) {
  return useApiQuery<NotificationPageResponse>({
    queryKey: notificationsKey(query),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<NotificationPageResponse>>("/api/notifications", {
        params: {
          page: query?.page ?? 1,
          pageSize: query?.pageSize ?? 20,
        },
      });

      if (!response.data.success || !response.data.data) {
        throw new ApiError(
          response.data.message ?? "Không thể tải danh sách thông báo.",
          response.data.errors,
          response.status
        );
      }

      return response.data.data;
    },
  });
}

// FR-NOTI-03: thông báo đã gửi không sửa, không thu hồi được và Kế toán không có danh sách đã gửi,
// nên không có query nào cần làm mới sau khi gửi.
export function useBroadcastSchoolClosure() {
  return useApiMutation<SchoolClosureResponse, SchoolClosureRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<SchoolClosureResponse>>(
        "/api/notifications/school-closures",
        data
      );
      if (!response.data.success || !response.data.data) {
        throw new ApiError(
          response.data.message ?? "Không thể gửi thông báo nghỉ học.",
          response.data.errors,
          response.status
        );
      }
      return response.data.data;
    },
  });
}
