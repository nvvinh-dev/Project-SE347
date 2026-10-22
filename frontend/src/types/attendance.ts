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
