// Phản chiếu DTO trong NhaTre.Application/DTOs/Notifications (FR-NOTI-01..04, D25, D44, D45).

// FR-NOTI-03: Kế toán chỉ gửi nội dung; người nhận do backend xác định (D44).
export interface SchoolClosureRequest {
  content: string;
}

// Số phụ huynh đã nhận; bằng 0 khi chưa có tài khoản Phụ huynh nào đang hoạt động.
export interface SchoolClosureResponse {
  recipientCount: number;
}

// Khớp hằng SchoolClosurePrefix ở NotificationService: backend tự ghép, frontend chỉ dùng để xem trước.
export const SCHOOL_CLOSURE_PREFIX = "Nhà trường thông báo nghỉ học: ";
export const SCHOOL_CLOSURE_CONTENT_MAX = 500;

// DTO thông báo in-app hệ thống (FR-NOTI-01..04, D25)
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
