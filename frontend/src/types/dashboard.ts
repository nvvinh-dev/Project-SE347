/**
 * Định nghĩa DTO phản ánh chính xác backend Dashboard API (D45, AC-DASH-06, BR-DASHBOARD-02, BR-DASHBOARD-03)
 * Toàn bộ DTO chỉ chứa dữ liệu tổng hợp theo 3 khối, không chứa thông tin cá nhân hay ngoài phạm vi.
 */

export interface GradeLevelChildrenCountDto {
  gradeLevelId: number;
  gradeLevelName: string;
  sortOrder: number;
  minAgeMonths: number;
  maxAgeMonths: number;
  studentCount: number;
}

export interface ChildrenStatisticsResponse {
  totalStudents: number;
  assignedStudents: number;
  unassignedStudents: number;
  totalClasses: number;
  gradeLevels: GradeLevelChildrenCountDto[];
}

export interface GradeLevelAttendanceDto {
  gradeLevelId: number;
  gradeLevelName: string;
  sortOrder: number;
  totalRecords: number;
  presentRecords: number;
  attendanceRate: number;
}

export interface AttendanceStatisticsResponse {
  year: number;
  month: number;
  totalRecords: number;
  presentRecords: number;
  overallAttendanceRate: number;
  gradeLevels: GradeLevelAttendanceDto[];
}

export interface RevenueStatisticsResponse {
  year: number;
  month: number;
  totalCollected: number;
  unpaidInvoiceCount: number;
  generatedAtUtc: string;
}
