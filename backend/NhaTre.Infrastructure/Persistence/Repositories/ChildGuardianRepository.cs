using Microsoft.EntityFrameworkCore;
using Npgsql;
using NhaTre.Application.DTOs.Children;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class ChildGuardianRepository : IChildGuardianRepository
{
    private static readonly short ParentRoleId = Roles.ToRoleId(Roles.Parent);

    private readonly AppDbContext _dbContext;

    public ChildGuardianRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<GuardianResponse>> SearchActiveParentsAsync(string? search)
    {
        var query = _dbContext.Users
            .AsNoTracking()
            .Where(u => u.RoleId == ParentRoleId && u.IsActive);

        // login_identifier đã lưu chữ thường nên chỉ cần hạ chữ họ tên
        if (search is not null)
            query = query.Where(u => u.FullName.ToLower().Contains(search) || u.LoginIdentifier.Contains(search));

        return await SelectGuardians(OrderByName(query)).ToListAsync();
    }

    public async Task<GuardianResponse?> FindActiveParentAsync(Guid userId)
    {
        return await SelectGuardians(_dbContext.Users
                .AsNoTracking()
                .Where(u => u.Id == userId && u.RoleId == ParentRoleId && u.IsActive))
            .FirstOrDefaultAsync();
    }

    public async Task<bool> ChildExistsAsync(Guid childId)
    {
        return await _dbContext.Children.AnyAsync(c => c.Id == childId);
    }

    public async Task<IReadOnlyList<GuardianResponse>> GetGuardiansOfChildAsync(Guid childId)
    {
        var guardians = _dbContext.ChildGuardians
            .AsNoTracking()
            .Where(cg => cg.ChildId == childId)
            .Select(cg => cg.GuardianUser);

        return await SelectGuardians(OrderByName(guardians)).ToListAsync();
    }

    public async Task<GuardianResponse?> FindGuardianOfChildAsync(Guid childId, Guid guardianUserId)
    {
        return await SelectGuardians(_dbContext.ChildGuardians
                .AsNoTracking()
                .Where(cg => cg.ChildId == childId && cg.GuardianUserId == guardianUserId)
                .Select(cg => cg.GuardianUser))
            .FirstOrDefaultAsync();
    }

    public async Task<bool> LinkExistsAsync(Guid childId, Guid guardianUserId)
    {
        return await _dbContext.ChildGuardians
            .AnyAsync(cg => cg.ChildId == childId && cg.GuardianUserId == guardianUserId);
    }

    public async Task<bool> AddLinkAsync(Guid childId, Guid guardianUserId)
    {
        var link = new ChildGuardian { ChildId = childId, GuardianUserId = guardianUserId };
        _dbContext.ChildGuardians.Add(link);

        try
        {
            await _dbContext.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Khóa chính tổ hợp (child_id, guardian_user_id) chặn liên kết trùng. Bỏ theo dõi bản ghi
            // lỗi để một SaveChanges khác trong cùng request không thử ghi lại nó
            _dbContext.Entry(link).State = EntityState.Detached;
            return false;
        }
    }

    public async Task<bool> RemoveLinkAsync(Guid childId, Guid guardianUserId)
    {
        var deletedRows = await _dbContext.ChildGuardians
            .Where(cg => cg.ChildId == childId && cg.GuardianUserId == guardianUserId)
            .ExecuteDeleteAsync();

        return deletedRows == 1;
    }

    // Sắp xếp trước khi chiếu sang DTO: EF không dịch được OrderBy trên thuộc tính của record đã dựng
    private static IQueryable<User> OrderByName(IQueryable<User> users)
        => users.OrderBy(u => u.FullName).ThenBy(u => u.LoginIdentifier);

    private static IQueryable<GuardianResponse> SelectGuardians(IQueryable<User> users)
        => users.Select(u => new GuardianResponse(u.Id, u.FullName, u.LoginIdentifier));
}
