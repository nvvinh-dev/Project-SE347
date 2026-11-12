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
        var (year, month, _, _) = VietnamTime.MonthOf(DateTime.UtcNow);
        var startDate = new DateOnly(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var classCounts = await _dashboardRepository.GetClassAttendanceCountsAsync(startDate, endDate);

        var classDtos = classCounts.Select(c =>
        {
            var rate = c.TotalRecords > 0
                ? Math.Round((double)c.PresentRecords / c.TotalRecords * 100, 1)
                : 0.0;

            return new ClassAttendanceDto(
                ClassId: c.ClassId,
                ClassName: c.ClassName,
                TotalRecords: c.TotalRecords,
                PresentRecords: c.PresentRecords,
                AttendanceRate: rate,
                MinAgeMonths: c.MinAgeMonths,
                MaxAgeMonths: c.MaxAgeMonths
            );
        }).ToList();

        // Số liệu toàn trường tính bằng tổng các lớp hiện tại để bảo đảm tính nhất quán (khớp chính xác tổng 3 lớp)
        var totalRecords = classDtos.Sum(c => c.TotalRecords);
        var presentRecords = classDtos.Sum(c => c.PresentRecords);
        var overallRate = totalRecords > 0
            ? Math.Round((double)presentRecords / totalRecords * 100, 1)
            : 0.0;

        return new AttendanceStatisticsResponse(
            Year: year,
            Month: month,
            TotalRecords: totalRecords,
            PresentRecords: presentRecords,
            OverallAttendanceRate: overallRate,
            Classes: classDtos
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
