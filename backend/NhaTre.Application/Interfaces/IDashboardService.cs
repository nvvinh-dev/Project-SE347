using NhaTre.Application.DTOs.Dashboard;

namespace NhaTre.Application.Interfaces;

public interface IDashboardService
{
    Task<OverviewDashboardResponse> GetOverviewAsync();
    Task<ChildrenStatisticsResponse> GetChildrenStatisticsAsync();
}
