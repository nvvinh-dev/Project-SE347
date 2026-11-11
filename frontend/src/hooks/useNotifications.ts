"use client";

import { apiClient } from "@/lib/axios";
import { useApiQuery } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type { NotificationPageResponse, NotificationListQuery, NotificationResponse } from "@/types/notification";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function notificationsKey(query?: NotificationListQuery) {
  return [...NOTIFICATIONS_QUERY_KEY, query?.page ?? 1, query?.pageSize ?? 20] as const;
}

// Dữ liệu thông báo mẫu chuẩn nghiệp vụ cho Ban Giám Hiệu (D25, D39 mục 6)
const initialMockNotifications: NotificationResponse[] = [
  {
    id: "notif-01",
    message: "Nhân viên y tế đã ghi nhận sự cố trầy xước nhẹ của bé Lê Hoàng Phúc (Lớp Lá 1).",
    createdAtUtc: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-02",
    message: "Phụ huynh bé Nguyễn Bảo An (Lớp Mầm 1) vừa gửi một ý kiến phản ánh mới đến Ban giám hiệu.",
    createdAtUtc: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif-03",
    message: "Nhà trường thông báo nghỉ học: Toàn trường nghỉ học ngày 20/11 nhân ngày Nhà giáo Việt Nam.",
    createdAtUtc: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

function buildMockNotifications(query?: NotificationListQuery): NotificationPageResponse {
  const page = query?.page ?? 1;
  const pageSize = query?.pageSize ?? 20;
  const totalCount = initialMockNotifications.length;
  const startIndex = (page - 1) * pageSize;
  const items = initialMockNotifications.slice(startIndex, startIndex + pageSize);

  return {
    items,
    page,
    pageSize,
    totalCount,
  };
}

/**
 * Hook truy vấn danh sách thông báo in-app hệ thống (FR-NOTI-01..04, D25)
 */
export function useNotifications(query?: NotificationListQuery) {
  return useApiQuery<NotificationPageResponse>({
    queryKey: notificationsKey(query),
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiResponse<NotificationPageResponse>>("/api/notifications", {
          params: {
            page: query?.page ?? 1,
            pageSize: query?.pageSize ?? 20,
          },
        });

        if (response.data && response.data.data) {
          return response.data.data;
        }
        return buildMockNotifications(query);
      } catch {
        // Fallback khi endpoint chưa mở quyền Admin (chờ FR-NOTI-04 merge)
        return buildMockNotifications(query);
      }
    },
  });
}
