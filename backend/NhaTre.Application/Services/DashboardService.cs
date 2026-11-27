using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Dashboard;
using NhaTre.Application.Interfaces;

namespace NhaTre.Application.Services;

// FR-DASH-02, FR-DASH-03, FR-DASH-04: Thống kê số lượng trẻ, điểm danh và doanh thu cho Admin (D23, D39 mục 12)
// AC-DASH-06, D40 mục 3, D45: Xử lý số liệu tổng hợp, tuyệt đối không lộ dữ liệu từng trẻ
public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _dashboardRepository;
    private readonly ITuitionService _tuitionService;

    public DashboardService(
        IDashboardRepository dashboardRepository,
        ITuitionService tuitionService)
    {
        _dashboardRepository = dashboardRepository;
        _tuitionService = tuitionService;
    }

    public async Task<ChildrenStatisticsResponse> GetChildrenStatisticsAsync()
    {
        var totalStudents = await _dashboardRepository.GetTotalStudentsCountAsync();
        var unassignedStudents = await _dashboardRepository.GetUnassignedStudentsCountAsync();
        var activeClassesCount = await _dashboardRepository.GetActiveClassesCountAsync();
        var gradeLevels = await _dashboardRepository.GetChildrenCountByGradeLevelsAsync();

        var assignedStudents = Math.Max(0, totalStudents - unassignedStudents);

        return new ChildrenStatisticsResponse(
            TotalStudents: totalStudents,
            AssignedStudents: assignedStudents,
            UnassignedStudents: unassignedStudents,
            TotalClasses: activeClassesCount,
            GradeLevels: gradeLevels
        );
    }

    public async Task<AttendanceStatisticsResponse> GetAttendanceStatisticsAsync()
    {
        // D23, D39 mục 12: Thống kê điểm danh theo tháng hiện tại theo giờ Việt Nam, không có bộ lọc khoảng ngày tùy chọn
        var (year, month, _, _) = VietnamTime.MonthOf(DateTime.UtcNow);
        var startDate = new DateOnly(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var gradeLevelCounts = await _dashboardRepository.GetGradeLevelAttendanceCountsAsync(startDate, endDate);

        var gradeLevelDtos = gradeLevelCounts.Select(g =>
        {
            var rate = g.TotalRecords > 0
                ? Math.Round((double)g.PresentRecords / g.TotalRecords * 100, 1)
                : 0.0;

            return new GradeLevelAttendanceDto(
                GradeLevelId: g.GradeLevelId,
                GradeLevelName: g.GradeLevelName,
                SortOrder: g.SortOrder,
                TotalRecords: g.TotalRecords,
                PresentRecords: g.PresentRecords,
                AttendanceRate: rate
            );
        }).ToList();

        // Số liệu toàn trường tính bằng tổng các khối hiện tại để bảo đảm tính nhất quán
        var totalRecords = gradeLevelDtos.Sum(g => g.TotalRecords);
        var presentRecords = gradeLevelDtos.Sum(g => g.PresentRecords);
        var overallRate = totalRecords > 0
            ? Math.Round((double)presentRecords / totalRecords * 100, 1)
            : 0.0;

        return new AttendanceStatisticsResponse(
            Year: year,
            Month: month,
            TotalRecords: totalRecords,
            PresentRecords: presentRecords,
            OverallAttendanceRate: overallRate,
            GradeLevels: gradeLevelDtos
        );
    }

    public async Task<RevenueStatisticsResponse> GetRevenueStatisticsAsync()
    {
        // Lấy số liệu qua ITuitionService.GetRevenueReportAsync() (FR-TUITION-03), không tự tính lại
        // D39 mục 12: Kỳ báo cáo là tháng hiện tại, tổng thu trong tháng + số hóa đơn chưa thanh toán (unpaid)
        var report = await _tuitionService.GetRevenueReportAsync();

        return new RevenueStatisticsResponse(
            Year: report.Year,
            Month: report.Month,
            TotalCollected: report.TotalCollected,
            UnpaidInvoiceCount: report.UnpaidInvoiceCount,
            GeneratedAtUtc: report.GeneratedAtUtc
        );
    }
}
