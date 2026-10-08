namespace NhaTre.Application.DTOs.Children;

// Tạo và gỡ liên kết có nhiều kiểu thất bại (400, 404, 409), nên Service trả kết quả kèm lý do để
// Controller chọn status code và message
public enum GuardianLinkOutcome
{
    Success,
    ChildNotFound,
    InvalidGuardian,
    AlreadyLinked,
    LinkNotFound
}

public record GuardianLinkResult(GuardianLinkOutcome Outcome, GuardianResponse? Guardian = null);
