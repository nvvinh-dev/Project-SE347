import { apiClient, toApiError } from "@/lib/axios";
import type { ApiResponse } from "@/types/auth";
import type {
  AttendanceResponse,
  AttendanceStatus,
  CheckInRequest,
  StudentAttendanceItem,
} from "@/types/attendance";

export const INITIAL_MOCK_STUDENTS: StudentAttendanceItem[] = [
  {
    childId: "c1000000-0000-0000-0000-000000000001",
    fullName: "Nguyễn Gia Hân",
    gender: "Nữ",
    dateOfBirth: "15/03/2021",
    status: "Present",
    attendanceId: "att-001",
    checkInTime: "07:35",
    healthNotes: null,
  },
  {
    childId: "c1000000-0000-0000-0000-000000000002",
    fullName: "Trần Minh Khang",
    gender: "Nam",
    dateOfBirth: "20/05/2021",
    status: "Present",
    attendanceId: "att-002",
    checkInTime: "07:42",
    healthNotes: "Dị ứng hải sản (tôm, cua). Không cho ăn các món có tôm cua trong thực đơn.",
  },
  {
    childId: "c1000000-0000-0000-0000-000000000003",
    fullName: "Lê Hoàng Bách",
    gender: "Nam",
    dateOfBirth: "10/08/2021",
    status: "AbsentExcused",
    attendanceId: "att-003",
    checkInTime: "08:00",
    healthNotes: null,
  },
  {
    childId: "c1000000-0000-0000-0000-000000000004",
    fullName: "Phạm Bảo Anh",
    gender: "Nữ",
    dateOfBirth: "02/11/2021",
    status: null,
    attendanceId: null,
    checkInTime: null,
    healthNotes: "Bất dung nạp lactose, kiêng hoàn toàn sữa bò tươi và chế phẩm phô mai.",
  },
  {
    childId: "c1000000-0000-0000-0000-000000000005",
    fullName: "Võ Đức Anh",
    gender: "Nam",
    dateOfBirth: "18/02/2021",
    status: null,
    attendanceId: null,
    checkInTime: null,
    healthNotes: null,
  },
  {
    childId: "c1000000-0000-0000-0000-000000000006",
    fullName: "Đỗ Thùy Linh",
    gender: "Nữ",
    dateOfBirth: "25/07/2021",
    status: null,
    attendanceId: null,
    checkInTime: null,
    healthNotes: "Bệnh hen phế quản nhẹ khi thời tiết lạnh. Tránh để trẻ chạy nhảy quá sức ngoài gió.",
  },
  {
    childId: "c1000000-0000-0000-0000-000000000007",
    fullName: "Hoàng Tuấn Kiệt",
    gender: "Nam",
    dateOfBirth: "30/09/2021",
    status: null,
    attendanceId: null,
    checkInTime: null,
    healthNotes: null,
  },
  {
    childId: "c1000000-0000-0000-0000-000000000008",
    fullName: "Bùi Ngọc Mai",
    gender: "Nữ",
    dateOfBirth: "12/04/2021",
    status: "AbsentUnexcused",
    attendanceId: "att-004",
    checkInTime: "08:15",
    healthNotes: null,
  },
];

export async function checkInStudent(
  childId: string,
  status: AttendanceStatus
): Promise<AttendanceResponse> {
  const payload: CheckInRequest = { childId, status };

  try {
    const res = await apiClient.post<ApiResponse<AttendanceResponse>>(
      "/api/attendances",
      payload
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Ghi nhận điểm danh thất bại.");
    }
    return res.data.data;
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    if (apiErr.status === 409) {
      throw apiErr;
    }
    if (apiErr.status === 404 || apiErr.status === null) {
      return {
        id: `mock-${Date.now()}`,
        childId,
        childFullName: "",
        attendanceDate: new Date().toISOString().split("T")[0],
        checkInTimeUtc: new Date().toISOString(),
        status,
      };
    }
    throw apiErr;
  }
}
