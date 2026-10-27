using NhaTre.Application.DTOs.Dashboard;

namespace NhaTre.Application.Interfaces;

// FR-DASH-02, FR-DASH-03, FR-DASH-04: Thống kê số lượng trẻ, điểm danh và doanh thu cho Admin
public interface IDashboardService
{
    Task<ChildrenStatisticsResponse> GetChildrenStatisticsAsync();
    Task<AttendanceStatisticsResponse> GetAttendanceStatisticsAsync();
    Task<RevenueStatisticsResponse> GetRevenueStatisticsAsync();
}
