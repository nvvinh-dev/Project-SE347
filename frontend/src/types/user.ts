import type { Role } from "./auth";

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
}

export interface ChangeRoleRequest {
  role: Role;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export const USER_ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "Admin", label: "Quản trị viên", desc: "Quản trị toàn trường & Vận hành" },
  { value: "Teacher", label: "Giáo viên", desc: "Điểm danh & Chăm sóc lớp học" },
  { value: "Accountant", label: "Kế toán", desc: "Học phí & Quản lý thu chi" },
  { value: "Medical", label: "Nhân viên Y tế", desc: "Theo dõi sức khỏe & Sự cố" },
  { value: "Parent", label: "Phụ huynh", desc: "Theo dõi con & Đón trả trẻ" },
];
