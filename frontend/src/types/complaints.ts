// Phản chiếu DTO trong NhaTre.Application/DTOs/Complaints.

export type ComplaintStatus = "New" | "InProgress" | "Resolved";

// Phụ huynh xem: không kèm người gửi, người xử lý, họ tên trẻ hay lớp (D45).
export interface ChildComplaintResponse {
  id: string;
  content: string;
  status: ComplaintStatus;
  resolution: string | null;
  createdAtUtc: string;
  resolvedAtUtc: string | null;
}

// FR-COMPLAINT-01: chỉ gửi nội dung; trạng thái, người gửi, thời điểm do server đặt (D44).
export interface CreateComplaintRequest {
  content: string;
}

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  New: "Mới",
  InProgress: "Đang xử lý",
  Resolved: "Đã xử lý",
};

// D39 mục 18: tối đa 2000 ký tự sau khi bỏ khoảng trắng hai đầu.
export const COMPLAINT_CONTENT_MAX = 2000;
