using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Dashboard;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.API.Controllers;

// FR-DASH-01, FR-DASH-02: Dashboard tổng quan và thống kê số lượng trẻ cho Admin
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

    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<OverviewDashboardResponse>>> GetOverview()
    {
        var result = await _dashboardService.GetOverviewAsync();
        return Ok(ApiResponse<OverviewDashboardResponse>.Ok(result));
    }

    [HttpGet("children-statistics")]
    public async Task<ActionResult<ApiResponse<ChildrenStatisticsResponse>>> GetChildrenStatistics()
    {
        var result = await _dashboardService.GetChildrenStatisticsAsync();
        return Ok(ApiResponse<ChildrenStatisticsResponse>.Ok(result));
    }
}
