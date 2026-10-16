using NhaTre.Application.DTOs.Dashboard;

namespace NhaTre.Application.Interfaces;

public interface IDashboardRepository
{
    Task<int> GetTotalStudentsCountAsync();
    Task<int> GetUnassignedStudentsCountAsync();
    Task<IReadOnlyList<ClassChildrenCountDto>> GetChildrenCountByClassesAsync();
}
