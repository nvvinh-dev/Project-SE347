namespace NhaTre.Application.DTOs.Attendance;

// FR-ATT-02: phụ huynh xem lịch sử của đúng trẻ đã chọn trên URL, nên chỉ trả ngày, trạng thái và
// thời điểm ghi nhận (UC-ATT-02, D45); không kèm họ tên trẻ hay người ghi nhận.
// AttendanceDate và CheckInTimeUtc hiểu như AttendanceResponse
public record ChildAttendanceResponse(
    Guid Id,
    DateOnly AttendanceDate,
    DateTime CheckInTimeUtc,
    string Status);
