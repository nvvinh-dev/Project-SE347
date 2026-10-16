namespace NhaTre.Application.DTOs.Teachers;

// Tài khoản Giáo viên để Kế toán chọn khi lập hồ sơ: chỉ họ tên và email (D45).
// UserId là mã Kế toán gửi lại khi tạo hồ sơ
public record TeacherAccountResponse(
    Guid UserId,
    string FullName,
    string Email);
