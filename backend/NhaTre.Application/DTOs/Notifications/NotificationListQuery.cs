namespace NhaTre.Application.DTOs.Notifications;

// Tham số query của GET api/notifications. Dùng thuộc tính init thay vì record vị trí để
// thiếu tham số nào thì giữ giá trị mặc định
public record NotificationListQuery
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
