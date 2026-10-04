namespace NhaTre.Application.DTOs.Attendance;

// Điểm danh thất bại theo hai kiểu khác status code (404 ngoài phạm vi, 409 đã điểm danh),
// nên Service trả kết quả kèm lý do để Controller chọn status code
public enum AttendanceOutcome
{
    Success,
    ChildNotFound,
    AlreadyCheckedIn
}

public record AttendanceResult(AttendanceOutcome Outcome, AttendanceResponse? Attendance = null);
