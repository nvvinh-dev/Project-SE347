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

    public async Task<AttendanceStatisticsResponse> GetAttendanceStatisticsAsync(int year, int month, DateOnly startDate, DateOnly endDate)
    {
        // AC-DASH-03, D23: Tỷ lệ có mặt tháng hiện tại theo 3 lớp, bắt buộc lọc status = 'Present'
        // Toàn bộ dữ liệu trả ra là số liệu tổng hợp (AC-DASH-06, D45), không lộ thông tin từng trẻ
        var classRows = await _dbContext.Classes
            .AsNoTracking()
            .OrderBy(c => c.MinAgeMonths)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.MinAgeMonths,
                c.MaxAgeMonths,
                TotalRecords = c.Children
                    .SelectMany(ch => ch.Attendances)
                    .Count(a => a.AttendanceDate >= startDate && a.AttendanceDate < endDate),
                PresentRecords = c.Children
                    .SelectMany(ch => ch.Attendances)
                    .Count(a => a.AttendanceDate >= startDate && a.AttendanceDate < endDate && a.Status == AttendanceStatuses.Present)
            })
            .ToListAsync();

        var classDtos = classRows.Select(c =>
        {
            var rate = c.TotalRecords > 0
                ? Math.Round((double)c.PresentRecords / c.TotalRecords * 100, 1)
                : 0.0;

            return new ClassAttendanceDto(
                ClassId: c.Id,
                ClassName: c.Name,
                TotalRecords: c.TotalRecords,
                PresentRecords: c.PresentRecords,
                AttendanceRate: rate,
                MinAgeMonths: c.MinAgeMonths,
                MaxAgeMonths: c.MaxAgeMonths
            );
        }).ToList();

        var totalRecords = await _dbContext.Attendances
            .CountAsync(a => a.AttendanceDate >= startDate && a.AttendanceDate < endDate);

        var presentRecords = await _dbContext.Attendances
            .CountAsync(a => a.AttendanceDate >= startDate && a.AttendanceDate < endDate && a.Status == AttendanceStatuses.Present);

        var overallRate = totalRecords > 0
            ? Math.Round((double)presentRecords / totalRecords * 100, 1)
            : 0.0;

        return new AttendanceStatisticsResponse(
            Year: year,
            Month: month,
            TotalRecords: totalRecords,
            PresentRecords: presentRecords,
            OverallAttendanceRate: overallRate,
            Classes: classDtos
        );
    }
}
