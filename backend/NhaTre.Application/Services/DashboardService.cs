using NhaTre.Application.DTOs.Dashboard;
using NhaTre.Application.Interfaces;

namespace NhaTre.Application.Services;

// FR-DASH-01, FR-DASH-02: Dashboard tổng quan và thống kê số lượng trẻ
// AC-DASH-06, D40 mục 3, D45: Xử lý số liệu tổng hợp, tuyệt đối không lộ dữ liệu từng trẻ
public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _dashboardRepository;

    public DashboardService(IDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    public async Task<OverviewDashboardResponse> GetOverviewAsync()
    {
        var totalStudents = await _dashboardRepository.GetTotalStudentsCountAsync();
        var unassignedStudents = await _dashboardRepository.GetUnassignedStudentsCountAsync();
        var activeStaff = await _dashboardRepository.GetActiveStaffCountAsync();
        var classes = await _dashboardRepository.GetChildrenCountByClassesAsync();

        var assignedStudents = Math.Max(0, totalStudents - unassignedStudents);
        var classesWithTeacherCount = classes.Count(c => !string.IsNullOrEmpty(c.HomeroomTeacherName));

        return new OverviewDashboardResponse(
            TotalStudents: totalStudents,
            AssignedStudents: assignedStudents,
            UnassignedStudents: unassignedStudents,
            TotalClasses: classes.Count,
            ClassesWithTeacherCount: classesWithTeacherCount,
            ActiveStaffCount: activeStaff,
            Classes: classes
        );
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
            Classes: classes
        );
    }
}
