using NhaTre.Application.DTOs.Notifications;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class NotificationService : INotificationService
{
    // D25: tiền tố cố định do backend ghép, phần nội dung do Kế toán nhập
    private const string SchoolClosurePrefix = "Nhà trường thông báo nghỉ học: ";

    private readonly INotificationRepository _notificationRepository;

    public NotificationService(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task NotifyParentsOfChildAsync(Guid childId, string message)
    {
        EnsureMessage(message);
        var recipientIds = await _notificationRepository.GetActiveParentIdsOfChildAsync(childId);
        await SaveAsync(recipientIds, message);
    }

    public async Task NotifyParentsOfClassAsync(Guid classId, string message)
    {
        EnsureMessage(message);
        var recipientIds = await _notificationRepository.GetActiveParentIdsOfClassAsync(classId);
        await SaveAsync(recipientIds, message);
    }

    public async Task NotifyActiveMedicalUsersAsync(string message)
    {
        EnsureMessage(message);
        var recipientIds = await _notificationRepository.GetActiveMedicalUserIdsAsync();
        await SaveAsync(recipientIds, message);
    }

    public async Task<int> NotifyActiveParentsAsync(string message)
    {
        EnsureMessage(message);
        var recipientIds = await _notificationRepository.GetActiveParentIdsAsync();
        await SaveAsync(recipientIds, message);
        return recipientIds.Count;
    }

    public async Task<SchoolClosureResponse> BroadcastSchoolClosureAsync(SchoolClosureRequest request)
    {
        var recipientCount = await NotifyActiveParentsAsync(SchoolClosurePrefix + request.Content.Trim());
        return new SchoolClosureResponse(recipientCount);
    }

    public async Task<NotificationPageResponse> GetMyNotificationsAsync(Guid recipientUserId, NotificationListQuery query)
    {
        var totalCount = await _notificationRepository.CountByRecipientAsync(recipientUserId);

        // Tính bằng long vì page rất lớn nhân pageSize vượt int. Trang nằm sau trang cuối thì
        // không cần truy vấn; còn lại skip nhỏ hơn totalCount nên ép về int an toàn
        var skip = (long)(query.Page - 1) * query.PageSize;
        IReadOnlyList<Notification> notifications = [];
        if (skip < totalCount)
            notifications = await _notificationRepository.GetByRecipientAsync(recipientUserId, (int)skip, query.PageSize);

        var items = notifications
            .Select(n => new NotificationResponse(n.Id, n.Message, n.CreatedAt))
            .ToList();

        return new NotificationPageResponse(items, query.Page, query.PageSize, totalCount);
    }

    // Message do backend soạn, rỗng là lỗi lập trình của module gọi, không phải lỗi người dùng
    private static void EnsureMessage(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Nội dung thông báo không được để trống.", nameof(message));
    }

    // Không có người nhận (trẻ chưa liên kết phụ huynh, lớp trống...) thì không ghi gì
    private async Task SaveAsync(IReadOnlyList<Guid> recipientIds, string message)
    {
        if (recipientIds.Count == 0)
            return;

        var createdAt = DateTime.UtcNow;
        _notificationRepository.AddRange(recipientIds.Select(recipientId => new Notification
        {
            RecipientUserId = recipientId,
            Message = message,
            CreatedAt = createdAt
        }));

        await _notificationRepository.SaveChangesAsync();
    }
}
