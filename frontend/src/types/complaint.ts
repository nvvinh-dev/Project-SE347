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
