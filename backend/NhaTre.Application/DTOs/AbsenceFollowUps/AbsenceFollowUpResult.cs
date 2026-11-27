namespace NhaTre.Application.DTOs.AbsenceFollowUps;

// Ghi liên hệ thất bại theo hai kiểu khác status code (404 ngoài phạm vi, 409 sai điều kiện ghi),
// nên Service trả kết quả kèm lý do để Controller chọn status code
public enum AbsenceFollowUpOutcome
{
    Success,
    AttendanceNotFound,
    NotUnexcusedToday
}

public record AbsenceFollowUpResult(AbsenceFollowUpOutcome Outcome, AbsenceFollowUpResponse? FollowUp = null);
