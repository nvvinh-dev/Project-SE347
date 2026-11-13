/**
 * Định nghĩa DTO phản ánh và xử lý ý kiến của phụ huynh (FR-COMPLAINT-01/02, D24, D39 mục 18, D45).
 * Khớp đúng backend NhaTre.Application/DTOs/Complaints/
 */

export type ComplaintStatus = "New" | "InProgress" | "Resolved";

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  New: "Mới",
  InProgress: "Đang xử lý",
  Resolved: "Đã xử lý",
};

export interface ComplaintResponse {
  id: string;
  childId: string;
  childFullName: string;
  className: string | null;
  submittedByFullName: string;
  content: string;
  status: ComplaintStatus;
  resolution?: string | null;
  createdAtUtc: string;
  resolvedAtUtc?: string | null;
}

// Phụ huynh xem (FR-COMPLAINT-01): không kèm người gửi, người xử lý, họ tên trẻ hay lớp (D45).
export interface ChildComplaintResponse {
  id: string;
  content: string;
  status: ComplaintStatus;
  resolution: string | null;
  createdAtUtc: string;
  resolvedAtUtc: string | null;
}

// Phụ huynh chỉ gửi nội dung; trạng thái, người gửi, thời điểm do server đặt (D44).
export interface CreateComplaintRequest {
  content: string;
}

// D39 mục 18: nội dung tối đa 2000 ký tự sau khi bỏ khoảng trắng hai đầu.
export const COMPLAINT_CONTENT_MAX = 2000;

export interface HandleComplaintRequest {
  status: "InProgress" | "Resolved";
  resolution?: string | null;
}

export type ComplaintHandlingRequest = HandleComplaintRequest;

export interface ComplaintListQuery {
  status?: ComplaintStatus;
  page?: number;
  pageSize?: number;
}

export interface ComplaintPageResponse {
  items: ComplaintResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// Giữ alias tương thích nếu có import
export type ComplaintListResponse = ComplaintPageResponse;
