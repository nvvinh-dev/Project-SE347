/**
 * Định nghĩa DTO phản ánh chính xác backend Dashboard API (D45, AC-DASH-06, BR-DASHBOARD-02, BR-DASHBOARD-03)
 * Toàn bộ DTO chỉ chứa dữ liệu tổng hợp, không chứa thông tin cá nhân hay ngoài phạm vi.
 */

export interface ClassChildrenCountDto {
  classId: string;
  className: string;
  studentCount: number;
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
}

export interface ChildrenStatisticsResponse {
  totalStudents: number;
  assignedStudents: number;
  unassignedStudents: number;
  totalClasses: number;
  classes: ClassChildrenCountDto[];
}

export interface ClassAttendanceDto {
  classId: string;
  className: string;
  totalRecords: number;
  presentRecords: number;
  attendanceRate: number;
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
}

export interface AttendanceStatisticsResponse {
  year: number;
  month: number;
  totalRecords: number;
  presentRecords: number;
  overallAttendanceRate: number;
  classes: ClassAttendanceDto[];
}
