/**
 * Định nghĩa DTO phản ánh và xử lý ý kiến của phụ huynh (FR-COMPLAINT-01/02, D45)
 */

export type ComplaintStatus = "Pending" | "InProgress" | "Resolved";

export interface ComplaintChildDto {
  id: string;
  fullName: string;
  className: string;
}

export interface ComplaintParentDto {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

export interface ComplaintResponse {
  id: string;
  child: ComplaintChildDto;
  parent: ComplaintParentDto;
  content: string;
  status: ComplaintStatus;
  photoUrl?: string | null;
  photoPath?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedByName?: string | null;
  resolution?: string | null;
}

export interface ComplaintHandlingRequest {
  status: "InProgress" | "Resolved";
  resolution: string;
}

export interface ComplaintListQuery {
  status?: ComplaintStatus | "All";
  page?: number;
  pageSize?: number;
}

export interface ComplaintListResponse {
  items: ComplaintResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pendingCount: number;
  inProgressCount: number;
  resolvedCount: number;
}

