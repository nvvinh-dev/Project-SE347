namespace NhaTre.Application.DTOs.Notifications;

// Số phụ huynh đã nhận thông báo; bằng 0 khi không có tài khoản Phụ huynh nào đang hoạt động
public record SchoolClosureResponse(int RecipientCount);
