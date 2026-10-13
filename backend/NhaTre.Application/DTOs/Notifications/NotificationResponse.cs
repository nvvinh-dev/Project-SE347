namespace NhaTre.Application.DTOs.Notifications;

// Không có trạng thái đã đọc và không trỏ tới bản ghi gây ra thông báo (D25)
public record NotificationResponse(
    Guid Id,
    string Message,
    DateTime CreatedAtUtc);
