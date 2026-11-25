namespace NhaTre.Application.DTOs.Attendance;

// Lô thất bại theo hai kiểu khác status code (404 có trẻ ngoài phạm vi, 409 vấp bản điểm danh vừa được
// ghi cùng lúc), nên Service trả kết quả kèm lý do để Controller chọn status code
public enum BatchCheckInOutcome
{
    Success,
    ChildNotFound,
    ConcurrentCheckIn
}

public record BatchCheckInResult(BatchCheckInOutcome Outcome, IReadOnlyList<BatchCheckInItemResponse>? Items = null);
