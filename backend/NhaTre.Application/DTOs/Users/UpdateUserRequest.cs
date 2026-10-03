namespace NhaTre.Application.DTOs.Users;

// Sửa tài khoản chỉ đổi họ tên và email. Vai trò đổi ở FR-USER-02, mật khẩu qua đặt lại mật khẩu,
// trạng thái qua vô hiệu hóa/mở lại — client gửi kèm các trường đó thì bị bỏ qua
public record UpdateUserRequest(
    string FullName,
    string Email);
