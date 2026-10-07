using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Health;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Sức khỏe gồm nhiều tài nguyên do nhiều vai trò ghi (giáo viên ghi sức khỏe nhanh, Y tế ghi
// số đo), nên [Authorize] gắn theo từng action thay vì cả controller.
// FR-HEALTH-01: chỉ Giáo viên tạo bản ghi sức khỏe nhanh (BR-HEALTH-01), và chỉ cho trẻ lớp mình
// chủ nhiệm (D40 mục 2). Bản ghi đã tạo không sửa, không xóa.
[ApiController]
[Route("api")]
public class HealthController : ControllerBase
{
    private readonly IHealthService _healthService;
    private readonly IValidator<QuickHealthStatusRequest> _quickHealthStatusValidator;

    public HealthController(
        IHealthService healthService,
        IValidator<QuickHealthStatusRequest> quickHealthStatusValidator)
    {
        _healthService = healthService;
        _quickHealthStatusValidator = quickHealthStatusValidator;
    }

    [HttpGet("quick-health-statuses/{id:guid}")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<QuickHealthStatusResponse>>> GetQuickHealthStatusById(Guid id)
    {
        var result = await _healthService.GetQuickHealthStatusByIdAsync(id, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<QuickHealthStatusResponse>.Fail("Không tìm thấy bản ghi sức khỏe."));

        return Ok(ApiResponse<QuickHealthStatusResponse>.Ok(result));
    }

    [HttpPost("quick-health-statuses")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<QuickHealthStatusResponse>>> CreateQuickHealthStatus(
        [FromBody] QuickHealthStatusRequest request)
    {
        var validationResult = await _quickHealthStatusValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<QuickHealthStatusResponse>.Fail(errors));
        }

        var result = await _healthService.CreateQuickHealthStatusAsync(request, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<QuickHealthStatusResponse>.Fail("Không tìm thấy trẻ."));

        return CreatedAtAction(nameof(GetQuickHealthStatusById), new { id = result.Id },
            ApiResponse<QuickHealthStatusResponse>.Ok(result));
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
