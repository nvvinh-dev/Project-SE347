namespace NhaTre.Application.DTOs.Children;

// D45: Kế toán chỉ nhận họ tên và email của tài khoản phụ huynh, không kèm vai trò hay trạng thái
// tài khoản. UserId là mã Kế toán gửi lại khi liên kết hoặc gỡ liên kết. Dùng chung cho danh sách
// tài khoản Phụ huynh để chọn và danh sách phụ huynh đã liên kết với một trẻ
public record GuardianResponse(
    Guid UserId,
    string FullName,
    string Email);
