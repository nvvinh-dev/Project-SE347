using Microsoft.EntityFrameworkCore;
using Npgsql;
using NhaTre.Application.DTOs.Teachers;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class TeacherRepository : ITeacherRepository
{
    private static readonly short TeacherRoleId = Roles.ToRoleId(Roles.Teacher);

    private readonly AppDbContext _dbContext;

    public TeacherRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<TeacherResponse>> GetAllAsync()
    {
        return await SelectTeachers(_dbContext.Teachers
                .AsNoTracking()
                .OrderBy(t => t.User.FullName)
                .ThenBy(t => t.User.LoginIdentifier))
            .ToListAsync();
    }

    public async Task<TeacherResponse?> FindByIdAsync(Guid id)
    {
        return await SelectTeachers(_dbContext.Teachers
                .AsNoTracking()
                .Where(t => t.Id == id))
            .FirstOrDefaultAsync();
    }

    public async Task<IReadOnlyList<TeacherAccountResponse>> GetAccountsWithoutProfileAsync()
    {
        return await SelectAccounts(_dbContext.Users
                .AsNoTracking()
                .Where(u => u.RoleId == TeacherRoleId && u.IsActive && u.Teacher == null)
                .OrderBy(u => u.FullName)
                .ThenBy(u => u.LoginIdentifier))
            .ToListAsync();
    }

    public async Task<TeacherAccountResponse?> FindActiveTeacherAccountAsync(Guid userId)
    {
        return await SelectAccounts(_dbContext.Users
                .AsNoTracking()
                .Where(u => u.Id == userId && u.RoleId == TeacherRoleId && u.IsActive))
            .FirstOrDefaultAsync();
    }

    public async Task<bool> ProfileExistsAsync(Guid userId)
    {
        return await _dbContext.Teachers.AnyAsync(t => t.UserId == userId);
    }

    public async Task<bool> AddAsync(Teacher teacher)
    {
        _dbContext.Teachers.Add(teacher);

        try
        {
            await _dbContext.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Unique index trên user_id giữ quan hệ 1:1 với users. Bỏ theo dõi bản ghi lỗi để một
            // SaveChanges khác trong cùng request không thử ghi lại nó
            _dbContext.Entry(teacher).State = EntityState.Detached;
            return false;
        }
    }

    // Sắp xếp trước khi chiếu sang DTO: EF không dịch được OrderBy trên thuộc tính của record đã dựng
    private static IQueryable<TeacherResponse> SelectTeachers(IQueryable<Teacher> teachers)
        => teachers.Select(t => new TeacherResponse(
            t.Id,
            t.UserId,
            t.User.FullName,
            t.User.LoginIdentifier,
            t.CreatedAt));

    private static IQueryable<TeacherAccountResponse> SelectAccounts(IQueryable<User> users)
        => users.Select(u => new TeacherAccountResponse(u.Id, u.FullName, u.LoginIdentifier));
}
