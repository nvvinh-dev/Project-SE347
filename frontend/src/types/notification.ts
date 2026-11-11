/**
 * Định nghĩa DTO thông báo in-app hệ thống (FR-NOTI-01..04, D25, D45)
 */

export interface NotificationResponse {
  id: string;
  message: string;
  createdAtUtc: string;
}

export interface NotificationPageResponse {
  items: NotificationResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface NotificationListQuery {
  page?: number;
  pageSize?: number;
}

