using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Pickup;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Đón trả gồm bản ghi đón về của giáo viên và người đón đã đăng ký của phụ huynh, nên route
// gốc là api/ và Roles gắn theo từng action. [Authorize] ở mức class để action nào quên gắn Roles
// vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-PICKUP-01: chỉ Giáo viên ghi nhận đón về (BR-PICKUP-01), và chỉ cho trẻ lớp mình chủ nhiệm
// (D40 mục 2). Bản ghi đã tạo không sửa, không xóa.
[ApiController]
[Route("api")]
[Authorize]
public class PickupController : ControllerBase
{
    private readonly IPickupService _pickupService;
    private readonly IValidator<CreatePickupRequest> _createPickupValidator;

    public PickupController(
        IPickupService pickupService,
        IValidator<CreatePickupRequest> createPickupValidator)
    {
        _pickupService = pickupService;
        _createPickupValidator = createPickupValidator;
    }

    [HttpGet("pickups/{id:guid}")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<PickupResponse>>> GetById(Guid id)
    {
        var result = await _pickupService.GetByIdAsync(id, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<PickupResponse>.Fail("Không tìm thấy bản ghi đón về."));

        return Ok(ApiResponse<PickupResponse>.Ok(result));
    }

    [HttpPost("pickups")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<PickupResponse>>> Create([FromBody] CreatePickupRequest request)
    {
        var validationResult = await _createPickupValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<PickupResponse>.Fail(errors));
        }

        var result = await _pickupService.CreateAsync(request, CurrentUserId());

        return result.Outcome switch
        {
            PickupOutcome.Success => CreatedAtAction(nameof(GetById), new { id = result.Pickup!.Id },
                ApiResponse<PickupResponse>.Ok(result.Pickup)),
            PickupOutcome.ChildNotFound => NotFound(ApiResponse<PickupResponse>.Fail("Không tìm thấy trẻ.")),
            PickupOutcome.PickupPersonNotFound => NotFound(ApiResponse<PickupResponse>.Fail(
                "Không tìm thấy người đón đã đăng ký của trẻ.")),
            PickupOutcome.NotCheckedInToday => Conflict(ApiResponse<PickupResponse>.Fail(
                "Trẻ chưa được điểm danh hôm nay nên chưa ghi nhận đón về được.")),
            PickupOutcome.ChildAbsent => Conflict(ApiResponse<PickupResponse>.Fail(
                "Trẻ vắng hôm nay nên không ghi nhận đón về được.")),
            PickupOutcome.AlreadyPickedUp => Conflict(ApiResponse<PickupResponse>.Fail(
                "Trẻ đã được ghi nhận đón về hôm nay. Bản ghi đón về đã ghi không sửa được.")),
            PickupOutcome.NoPrimaryPerson => Conflict(ApiResponse<PickupResponse>.Fail(
                "Trẻ chưa có người đón chính nên chưa ghi nhận đón về được.")),
            PickupOutcome.MethodMismatch => Conflict(ApiResponse<PickupResponse>.Fail(
                "Cách đón không khớp với người đón được chọn.")),
            _ => throw new InvalidOperationException($"Kết quả ghi nhận đón về không xử lý: {result.Outcome}")
        };
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
