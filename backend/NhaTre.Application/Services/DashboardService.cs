using NhaTre.Application.DTOs.Dashboard;
using NhaTre.Application.Interfaces;

namespace NhaTre.Application.Services;

// FR-DASH-02: Thống kê số lượng trẻ cho Admin (D39 mục 12: tổng toàn trường và tách theo các khối lớp)
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
}
