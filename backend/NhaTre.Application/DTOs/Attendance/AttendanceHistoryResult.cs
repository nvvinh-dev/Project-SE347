namespace NhaTre.Application.DTOs.Attendance;

// Xem lịch sử ngoài phạm vi có hai kiểu 404 (lớp hoặc trẻ không thuộc lớp mình phụ trách),
// nên Service trả kết quả kèm lý do để Controller chọn message
public enum AttendanceHistoryOutcome
{
    Success,
    ClassNotFound,
    ChildNotFound
}

public record AttendanceHistoryResult(
    AttendanceHistoryOutcome Outcome,
    IReadOnlyList<AttendanceResponse>? Attendances = null);
