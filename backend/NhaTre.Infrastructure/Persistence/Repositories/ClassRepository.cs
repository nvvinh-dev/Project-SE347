using Microsoft.EntityFrameworkCore;
using NhaTre.Application.DTOs.Classes;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class ClassRepository : IClassRepository
{
    private readonly AppDbContext _dbContext;

    public ClassRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Xếp theo nhóm tuổi: Mầm, Chồi, Lá
    public async Task<IReadOnlyList<ClassResponse>> GetAllAsync()
    {
        return await _dbContext.Classes
            .AsNoTracking()
            .OrderBy(c => c.MinAgeMonths)
            .Select(c => new ClassResponse(
                c.Id,
                c.Name,
                c.MinAgeMonths,
                c.MaxAgeMonths,
                c.HomeroomTeacher == null
                    ? null
                    : new HomeroomTeacherResponse(c.HomeroomTeacher.UserId, c.HomeroomTeacher.User.FullName)))
            .ToListAsync();
    }

    // Không theo dõi thay đổi: mọi thao tác ghi đi qua câu UPDATE riêng
    public async Task<Class?> FindByIdAsync(Guid id)
    {
        return await _dbContext.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IReadOnlyList<ClassPlacementResponse>> GetPlacementsAsync()
    {
        // Sắp xếp trước khi chiếu sang DTO: EF không dịch được OrderBy trên thuộc tính của record đã dựng
        return await SelectPlacements(_dbContext.Children.AsNoTracking().OrderBy(c => c.FullName))
            .ToListAsync();
    }

    public async Task<ClassPlacementResponse?> FindPlacementAsync(Guid childId)
    {
        return await SelectPlacements(_dbContext.Children.AsNoTracking().Where(c => c.Id == childId))
            .FirstOrDefaultAsync();
    }

    public async Task<bool> AssignClassAsync(Guid childId, Guid classId, DateOnly expectedDateOfBirth)
    {
        var updatedRows = await _dbContext.Children
            .Where(c => c.Id == childId && c.DateOfBirth == expectedDateOfBirth)
            .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.ClassId, (Guid?)classId));

        return updatedRows == 1;
    }

    public async Task<bool> RemoveFromClassAsync(Guid childId)
    {
        var updatedRows = await _dbContext.Children
            .Where(c => c.Id == childId && c.ClassId != null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.ClassId, (Guid?)null));

        return updatedRows == 1;
    }

    public async Task<User?> FindUserWithTeacherProfileAsync(Guid userId)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Teacher)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task SetHomeroomTeacherAsync(Guid classId, Guid? teacherId)
    {
        await _dbContext.Classes
            .Where(c => c.Id == classId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.HomeroomTeacherId, teacherId));
    }

    // D45: chọn đúng 5 cột, không đọc ngày nhập học hay health_notes của trẻ
    private static IQueryable<ClassPlacementResponse> SelectPlacements(IQueryable<Child> children)
        => children.Select(c => new ClassPlacementResponse(
            c.Id,
            c.FullName,
            c.DateOfBirth,
            c.ClassId,
            c.Class == null ? null : c.Class.Name));
}
