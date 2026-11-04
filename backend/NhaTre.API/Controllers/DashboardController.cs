using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Dashboard;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.API.Controllers;

// FR-DASH-02: Thống kê số lượng trẻ cho Admin (D39 mục 12)
// AC-DASH-05: Chỉ vai trò Admin được phép truy cập; vai trò khác trả về 403 Forbidden
// AC-DASH-06, D40 mục 3, D45: Toàn bộ phản hồi chỉ chứa số liệu tổng hợp, không có dữ liệu mức từng trẻ
[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = Roles.Admin)]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("children-statistics")]
    public async Task<ActionResult<ApiResponse<ChildrenStatisticsResponse>>> GetChildrenStatistics()
    {
        var result = await _dashboardService.GetChildrenStatisticsAsync();
        return Ok(ApiResponse<ChildrenStatisticsResponse>.Ok(result));
    }

    // FR-DASH-03, AC-DASH-03: Thống kê tỷ lệ có mặt theo tháng hiện tại, tách theo 3 lớp, lọc status = 'Present' (D23, D39 mục 12)
    // AC-DASH-05: Chỉ Admin được phép truy cập; các vai trò khác nhận 403 Forbidden
    // AC-DASH-06, D40 mục 3, D45: Toàn bộ phản hồi là số liệu tổng hợp, tuyệt đối không có dữ liệu mức từng trẻ
    [HttpGet("attendance-statistics")]
    public async Task<ActionResult<ApiResponse<AttendanceStatisticsResponse>>> GetAttendanceStatistics()
    {
        var result = await _dashboardService.GetAttendanceStatisticsAsync();
        return Ok(ApiResponse<AttendanceStatisticsResponse>.Ok(result));
    }
}
