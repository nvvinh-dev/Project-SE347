namespace NhaTre.Application.DTOs.Attendance;

// Kết quả của một trẻ trong lô. AlreadyCheckedIn = true khi trẻ đã có bản điểm danh hôm nay từ trước:
// lô bỏ qua trẻ đó và Attendance là bản đã có, giữ nguyên (BR-ATTENDANCE-04, AC-ATT-11)
public record BatchCheckInItemResponse(Guid ChildId, bool AlreadyCheckedIn, AttendanceResponse Attendance);
