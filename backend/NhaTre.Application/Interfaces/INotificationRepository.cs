using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface INotificationRepository
{
    Task<IReadOnlyList<Guid>> GetActiveParentIdsOfChildAsync(Guid childId);
    Task<IReadOnlyList<Guid>> GetActiveParentIdsOfClassAsync(Guid classId);
    Task<IReadOnlyList<Guid>> GetActiveMedicalUserIdsAsync();
    Task<IReadOnlyList<Guid>> GetActiveParentIdsAsync();
    void AddRange(IEnumerable<Notification> notifications);
    Task SaveChangesAsync();

    Task<int> CountByRecipientAsync(Guid recipientUserId);
    Task<IReadOnlyList<Notification>> GetByRecipientAsync(Guid recipientUserId, int skip, int take);
}
