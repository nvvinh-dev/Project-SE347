namespace NhaTre.Application.DTOs.Notifications;

// TotalCount là tổng số thông báo của người gọi, để frontend tính số trang
public record NotificationPageResponse(
    IReadOnlyList<NotificationResponse> Items,
    int Page,
    int PageSize,
    int TotalCount);
