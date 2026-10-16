namespace NhaTre.Application.DTOs.Users;

// D45: chỉ họ tên, email, vai trò, trạng thái — không bao giờ có mật khẩu, hash hay token_version
public record UserResponse(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    bool IsActive);
