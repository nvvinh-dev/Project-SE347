using NhaTre.Application.DTOs.Dashboard;

namespace NhaTre.Application.Interfaces;

public interface IDashboardRepository
{
    Task<int> GetTotalStudentsCountAsync();
    Task<int> GetUnassignedStudentsCountAsync();
    Task<int> GetActiveClassesCountAsync();
    Task<IReadOnlyList<GradeLevelChildrenCountDto>> GetChildrenCountByGradeLevelsAsync();
    Task<IReadOnlyList<GradeLevelAttendanceCountDto>> GetGradeLevelAttendanceCountsAsync(DateOnly startDate, DateOnly endDate);
}
