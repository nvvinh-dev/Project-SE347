namespace NhaTre.Application.DTOs.Users;

// Admin đặt lại mật khẩu thủ công, không có quên mật khẩu tự động (D20)
public record ResetPasswordRequest(string NewPassword);
