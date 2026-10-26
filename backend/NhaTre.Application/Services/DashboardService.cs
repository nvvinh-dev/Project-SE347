using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Dashboard;
using NhaTre.Application.Interfaces;

namespace NhaTre.Application.Services;

// FR-DASH-02, FR-DASH-03: Thống kê số lượng trẻ và điểm danh cho Admin (D23, D39 mục 12)
// AC-DASH-06, D40 mục 3, D45: Xử lý số liệu tổng hợp, tuyệt đối không lộ dữ liệu từng trẻ
public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _dashboardRepository;

    public DashboardService(IDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<ChildrenStatisticsResponse> GetChildrenStatisticsAsync()
    {
        var totalStudents = await _dashboardRepository.GetTotalStudentsCountAsync();
        var unassignedStudents = await _dashboardRepository.GetUnassignedStudentsCountAsync();
        var classes = await _dashboardRepository.GetChildrenCountByClassesAsync();

        var assignedStudents = Math.Max(0, totalStudents - unassignedStudents);

        return new ChildrenStatisticsResponse(
            TotalStudents: totalStudents,
            AssignedStudents: assignedStudents,
            UnassignedStudents: unassignedStudents,
            TotalClasses: classes.Count,
            Classes: classes
        );
    }

    public async Task<AttendanceStatisticsResponse> GetAttendanceStatisticsAsync()
    {
        // D23, D39 mục 12: Thống kê điểm danh theo tháng hiện tại theo giờ Việt Nam, không có bộ lọc khoảng ngày tùy chọn
        var nowVietnam = VietnamTime.ToVietnamTime(DateTime.UtcNow);
        var year = nowVietnam.Year;
        var month = nowVietnam.Month;
        var startDate = new DateOnly(year, month, 1);
        var endDate = startDate.AddMonths(1);

        return await _dashboardRepository.GetAttendanceStatisticsAsync(year, month, startDate, endDate);
    }
}
