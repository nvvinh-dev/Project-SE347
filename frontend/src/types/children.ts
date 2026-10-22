export interface ChildResponse {
  id: string;
  fullName: string;
  dateOfBirth: string;
  enrollmentDate: string;
}

export interface ChildProfileRequest {
  fullName: string;
  dateOfBirth: string;
  enrollmentDate: string;
}

// GET /api/children/mine chỉ trả thông tin cần để phụ huynh chọn con.
export interface MyChildResponse {
  id: string;
  fullName: string;
}

export interface GuardianResponse {
  userId: string;
  fullName: string;
  email: string;
}

export interface LinkGuardianRequest {
  guardianUserId: string;
}
