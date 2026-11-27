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

    public async Task<int> GetActiveClassesCountAsync()
    {
        // BR-CLASS-05: Lớp đã lưu trữ không tính vào dashboard
        return await _dbContext.Classes.CountAsync(c => c.ArchivedAtUtc == null);
    }

    public async Task<IReadOnlyList<GradeLevelChildrenCountDto>> GetChildrenCountByGradeLevelsAsync()
    {
        // FR-DASH-02, D39 mục 12: Khoảng tuổi lấy từ GradeLevel, bỏ lớp đã lưu trữ (BR-CLASS-05)
        // Trẻ tính vào khối của lớp hiện tại; sắp xếp theo SortOrder của khối
        return await _dbContext.GradeLevels
            .AsNoTracking()
            .OrderBy(g => g.SortOrder)
            .Select(g => new GradeLevelChildrenCountDto(
                g.Id,
                g.Name,
                g.SortOrder,
                g.MinAgeMonths,
                g.MaxAgeMonths,
                _dbContext.Classes
                    .Where(c => c.GradeLevelId == g.Id && c.ArchivedAtUtc == null)
                    .SelectMany(c => c.Children)
                    .Count()
            ))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<GradeLevelAttendanceCountDto>> GetGradeLevelAttendanceCountsAsync(DateOnly startDate, DateOnly endDate)
    {
        // FR-DASH-03, AC-DASH-03, D23, D39 mục 12: Tỷ lệ có mặt tháng hiện tại tách theo 3 khối, bắt buộc lọc status = 'Present'
        // Gom một lần theo khối của lớp hiện tại của trẻ (chưa lưu trữ, BR-CLASS-05) rồi đếm tổng lượt và lượt có mặt
        var countsByGrade = await _dbContext.Attendances
            .AsNoTracking()
            .Where(a => a.AttendanceDate >= startDate
                && a.AttendanceDate < endDate
                && a.Child.ClassId != null
                && a.Child.Class!.ArchivedAtUtc == null)
            .GroupBy(a => a.Child.Class!.GradeLevelId)
            .Select(grp => new
            {
                GradeLevelId = grp.Key,
                TotalAttendanceRecords = grp.Count(),
                PresentCount = grp.Count(a => a.Status == AttendanceStatuses.Present)
            })
            .ToDictionaryAsync(x => x.GradeLevelId);

        var gradeLevels = await _dbContext.GradeLevels
            .AsNoTracking()
            .OrderBy(g => g.SortOrder)
            .Select(g => new { g.Id, g.Name, g.SortOrder })
            .ToListAsync();

        return gradeLevels
            .Select(g =>
            {
                countsByGrade.TryGetValue(g.Id, out var counts);
                return new GradeLevelAttendanceCountDto(
                    g.Id,
                    g.Name,
                    g.SortOrder,
                    counts?.TotalAttendanceRecords ?? 0,
                    counts?.PresentCount ?? 0);
            })
            .ToList();
    }
}
