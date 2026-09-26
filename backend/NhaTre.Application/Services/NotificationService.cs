using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class NotificationService : INotificationService
{
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

    public async Task NotifyActiveParentsAsync(string message)
    {
        EnsureMessage(message);
        var recipientIds = await _notificationRepository.GetActiveParentIdsAsync();
        await SaveAsync(recipientIds, message);
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
