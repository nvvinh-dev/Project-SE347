using Microsoft.EntityFrameworkCore;
using NhaTre.Application.DTOs.Dashboard;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly AppDbContext _dbContext;

    public DashboardRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<int> GetTotalStudentsCountAsync()
    {
        return await _dbContext.Children.CountAsync();
    }

    public async Task<int> GetUnassignedStudentsCountAsync()
    {
        return await _dbContext.Children.CountAsync(c => c.ClassId == null);
    }

    public async Task<int> GetActiveStaffCountAsync()
    {
        var parentRoleId = Roles.ToRoleId(Roles.Parent);
        return await _dbContext.Users.CountAsync(u => u.IsActive && u.RoleId != parentRoleId);
    }

    public async Task<IReadOnlyList<ClassChildrenCountDto>> GetChildrenCountByClassesAsync()
    {
        return await _dbContext.Classes
            .AsNoTracking()
            .OrderBy(c => c.MinAgeMonths)
            .Select(c => new ClassChildrenCountDto(
                c.Id,
                c.Name,
                c.Children.Count(),
                c.MinAgeMonths,
                c.MaxAgeMonths,
                c.HomeroomTeacher != null ? c.HomeroomTeacher.User.FullName : null
            ))
            .ToListAsync();
    }
}
