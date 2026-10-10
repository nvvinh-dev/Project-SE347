using Microsoft.EntityFrameworkCore;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private static readonly short MedicalRoleId = Roles.ToRoleId(Roles.Medical);
    private static readonly short ParentRoleId = Roles.ToRoleId(Roles.Parent);

    private readonly AppDbContext _dbContext;

    public NotificationRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Vẫn lọc role Phụ huynh dù child_guardians chỉ liên kết Phụ huynh: tài khoản có thể
    // đã bị đổi vai trò sau khi liên kết, mà chỉ Phụ huynh và Y tế nhận thông báo (BR-NOTIFICATION-01).
    public async Task<IReadOnlyList<Guid>> GetActiveParentIdsOfChildAsync(Guid childId)
    {
        return await _dbContext.ChildGuardians
            .Where(cg => cg.ChildId == childId
                && cg.GuardianUser.IsActive
                && cg.GuardianUser.RoleId == ParentRoleId)
            .Select(cg => cg.GuardianUserId)
            .ToListAsync();
    }

    // Một phụ huynh có hai con cùng lớp chỉ nhận một thông báo
    public async Task<IReadOnlyList<Guid>> GetActiveParentIdsOfClassAsync(Guid classId)
    {
        return await _dbContext.ChildGuardians
            .Where(cg => cg.Child.ClassId == classId
                && cg.GuardianUser.IsActive
                && cg.GuardianUser.RoleId == ParentRoleId)
            .Select(cg => cg.GuardianUserId)
            .Distinct()
            .ToListAsync();
    }

    public Task<IReadOnlyList<Guid>> GetActiveMedicalUserIdsAsync()
        => GetActiveUserIdsByRoleAsync(MedicalRoleId);

    public Task<IReadOnlyList<Guid>> GetActiveParentIdsAsync()
        => GetActiveUserIdsByRoleAsync(ParentRoleId);

    public void AddRange(IEnumerable<Notification> notifications)
    {
        _dbContext.Notifications.AddRange(notifications);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    public async Task<int> CountByRecipientAsync(Guid recipientUserId)
    {
        return await _dbContext.Notifications
            .CountAsync(n => n.RecipientUserId == recipientUserId);
    }

    // Mới nhất trước (D25). Hai thông báo có thể trùng created_at, nên xếp thêm theo id để thứ tự cố
    // định giữa các lần gọi, nhờ đó các trang không trùng hay sót thông báo
    public async Task<IReadOnlyList<Notification>> GetByRecipientAsync(Guid recipientUserId, int skip, int take)
    {
        return await _dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.RecipientUserId == recipientUserId)
            .OrderByDescending(n => n.CreatedAt)
            .ThenByDescending(n => n.Id)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    private async Task<IReadOnlyList<Guid>> GetActiveUserIdsByRoleAsync(short roleId)
    {
        return await _dbContext.Users
            .Where(u => u.RoleId == roleId && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();
    }
}
