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

export interface GuardianResponse {
  userId: string;
  fullName: string;
  email: string;
}

export interface LinkGuardianRequest {
  guardianUserId: string;
}
