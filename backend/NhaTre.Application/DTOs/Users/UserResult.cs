namespace NhaTre.Application.DTOs.Users;

// Thao tác trên tài khoản có nhiều kiểu thất bại (404, 409 vì nhiều lý do), nên Service trả
// kết quả kèm lý do để Controller chọn status code và message
public enum UserOutcome
{
    Success,
    UserNotFound,
    EmailTaken,
    SelfDeactivation,
    LastActiveAdmin,
    AlreadyInactive,
    AlreadyActive
}

public record UserResult(UserOutcome Outcome, UserResponse? User = null);
