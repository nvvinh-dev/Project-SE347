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

    public async Task<IReadOnlyList<ClassAttendanceCountDto>> GetClassAttendanceCountsAsync(DateOnly startDate, DateOnly endDate)
    {
        // AC-DASH-03, D23: Tỷ lệ có mặt tháng hiện tại theo 3 lớp, bắt buộc lọc status = 'Present'
        // Toàn bộ dữ liệu trả ra là số liệu tổng hợp (AC-DASH-06, D45), không lộ thông tin từng trẻ
        // Lớp tính theo lớp hiện tại của trẻ (c.Children). Trẻ đã gỡ khỏi lớp (class_id = null) không thuộc lớp nào.
        return await _dbContext.Classes
            .AsNoTracking()
            .OrderBy(c => c.MinAgeMonths)
            .Select(c => new ClassAttendanceCountDto(
                c.Id,
                c.Name,
                c.MinAgeMonths,
                c.MaxAgeMonths,
                c.Children
                    .SelectMany(ch => ch.Attendances)
                    .Count(a => a.AttendanceDate >= startDate && a.AttendanceDate < endDate),
                c.Children
                    .SelectMany(ch => ch.Attendances)
                    .Count(a => a.AttendanceDate >= startDate && a.AttendanceDate < endDate && a.Status == AttendanceStatuses.Present)
            ))
            .ToListAsync();
    }
}
