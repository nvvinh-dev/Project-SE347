using NhaTre.Application.DTOs.Dashboard;

namespace NhaTre.Application.Interfaces;

// FR-DASH-02, FR-DASH-03: Thống kê số lượng trẻ và điểm danh cho Admin
public interface IDashboardService
{
    Task<ChildrenStatisticsResponse> GetChildrenStatisticsAsync();
    Task<AttendanceStatisticsResponse> GetAttendanceStatisticsAsync();
}
