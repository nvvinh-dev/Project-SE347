export interface TeacherResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  createdAtUtc: string;
}

export interface TeacherAccountResponse {
  userId: string;
  fullName: string;
  email: string;
}

export interface CreateTeacherRequest {
  userId: string;
}
