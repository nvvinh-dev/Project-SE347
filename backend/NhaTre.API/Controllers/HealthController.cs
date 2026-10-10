using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Health;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Sức khỏe gồm nhiều tài nguyên do nhiều vai trò dùng (giáo viên ghi sức khỏe nhanh, Y tế ghi
// số đo), nên route gốc là api/ và Roles gắn theo từng action. [Authorize] ở mức class để action
// nào quên gắn Roles vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-HEALTH-01: chỉ Giáo viên tạo bản ghi sức khỏe nhanh (BR-HEALTH-01), và chỉ cho trẻ lớp mình
// chủ nhiệm (D40 mục 2). Bản ghi đã tạo không sửa, không xóa.
// FR-HEALTH-07: Giáo viên xem lưu ý sức khỏe của trẻ lớp mình chủ nhiệm, chỉ xem (BR-HEALTH-08)
[ApiController]
[Route("api")]
[Authorize]
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

    // Trẻ của các lớp mình chủ nhiệm, mỗi trẻ chỉ có id, họ tên và lưu ý sức khỏe (D45). Màn hình
    // giáo viên cũng dùng danh sách này để chọn trẻ khi điểm danh; chưa được gán lớp thì danh sách rỗng
    [HttpGet("homeroom-children")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<HomeroomChildResponse>>>> GetHomeroomChildren()
    {
        var result = await _healthService.GetHomeroomChildrenAsync(CurrentUserId());
        return Ok(ApiResponse<IReadOnlyList<HomeroomChildResponse>>.Ok(result));
    }

    // Trẻ không tồn tại và trẻ lớp khác cùng trả 404 (AC-HEALTH-17)
    [HttpGet("homeroom-children/{childId:guid}")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<HomeroomChildResponse>>> GetHomeroomChildById(Guid childId)
    {
        var result = await _healthService.GetHomeroomChildByIdAsync(childId, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<HomeroomChildResponse>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<HomeroomChildResponse>.Ok(result));
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
