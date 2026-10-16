using Microsoft.EntityFrameworkCore;
using NhaTre.Application.DTOs.Dashboard;
using NhaTre.Application.Interfaces;

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
                c.MaxAgeMonths
            ))
            .ToListAsync();
    }
}
