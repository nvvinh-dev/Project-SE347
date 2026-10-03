namespace NhaTre.Application.DTOs.Users;

// Admin tự nhập mật khẩu ban đầu, Service hash ngay và không lưu bản thô (D20).
// Role là một trong 5 hằng số Roles.*, bắt buộc chọn tường minh, không có giá trị mặc định (D43 mục 5)
public record CreateUserRequest(
    string FullName,
    string Email,
    string Password,
    string Role);
