namespace NhaTre.Application.DTOs.Teachers;

// D45: hồ sơ chỉ kèm họ tên và email của tài khoản, không kèm vai trò hay trạng thái tài khoản.
// UserId là mã Admin dùng khi gán giáo viên chủ nhiệm (FR-CLASS-01)
public record TeacherResponse(
    Guid Id,
    Guid UserId,
    string FullName,
    string Email,
    DateTime CreatedAtUtc);
