/**
 * Định nghĩa DTO phản ánh chính xác backend Dashboard API (D45, AC-DASH-06)
 * Toàn bộ DTO chỉ chứa dữ liệu tổng hợp, không chứa thông tin chi tiết từng trẻ.
 */

export interface ClassChildrenCountDto {
  classId: string;
  className: string;
  studentCount: number;
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
  homeroomTeacherName: string | null;
}

export interface ChildrenStatisticsResponse {
  totalStudents: number;
  assignedStudents: number;
  unassignedStudents: number;
  classes: ClassChildrenCountDto[];
}

export interface OverviewDashboardResponse {
  totalStudents: number;
  assignedStudents: number;
  unassignedStudents: number;
  totalClasses: number;
  classesWithTeacherCount: number;
  activeStaffCount: number;
  classes: ClassChildrenCountDto[];
}
