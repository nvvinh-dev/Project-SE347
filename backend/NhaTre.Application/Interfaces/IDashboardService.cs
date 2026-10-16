using NhaTre.Application.DTOs.Dashboard;

namespace NhaTre.Application.Interfaces;

// FR-DASH-02: Thống kê số lượng trẻ cho Admin
public interface IDashboardService
{
    Task<ChildrenStatisticsResponse> GetChildrenStatisticsAsync();
}
