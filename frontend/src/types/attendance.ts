export type AttendanceStatus = "Present" | "AbsentExcused" | "AbsentUnexcused";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  Present: "Có mặt",
  AbsentExcused: "Vắng có phép",
  AbsentUnexcused: "Vắng không phép",
};

export interface CheckInRequest {
  childId: string;
  status: AttendanceStatus;
}

export interface AttendanceResponse {
  id: string;
  childId: string;
  childFullName: string;
  attendanceDate: string;
  checkInTimeUtc: string;
  status: AttendanceStatus;
}

export interface AttendanceChild {
  childId: string;
  fullName: string;
  healthNotes?: string | null;
}

// DTO phía phụ huynh không có thông tin lớp hay người ghi nhận.
export interface ChildAttendanceResponse {
  id: string;
  attendanceDate: string;
  checkInTimeUtc: string;
  status: AttendanceStatus;
}

export interface HomeroomChildResponse {
  id: string;
  fullName: string;
  healthNotes: string | null;
}

export interface AttendanceHistoryFilter {
  childId?: string;
  date?: string;
}

export interface StudentAttendanceItem extends AttendanceChild {
  attendance: AttendanceResponse | null;
}

/**
 * Một lần liên hệ của giáo viên khi trẻ vắng không phép (FR-ATT-04, D39 mục 20, D45)
 */
export interface AbsenceFollowUpResponse {
  outcome: "Reached" | "Unreachable";
  note: string | null;
  recordedByTeacherName: string;
  recordedAtUtc: string;
}

/**
 * Dòng thông tin trẻ vắng không phép cần Ban giám hiệu xử lý hôm nay (FR-ATT-04, D39 mục 20, D40 mục 3, D45)
 * Chỉ có họ tên trẻ, lớp và các lần liên hệ; không kèm ID trẻ hay thông tin người đón.
 */
export interface AbsenceEscalationResponse {
  childFullName: string;
  className: string;
  followUps: AbsenceFollowUpResponse[];
}

