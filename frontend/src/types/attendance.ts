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

export interface StudentAttendanceItem {
  childId: string;
  fullName: string;
  gender: "Nam" | "Nữ";
  dateOfBirth: string;
  status: AttendanceStatus | null;
  attendanceId: string | null;
  checkInTime: string | null;
  healthNotes?: string | null;
}
