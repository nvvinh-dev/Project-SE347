using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.AbsenceFollowUps;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// FR-ATT-04 (D39 mục 20): Giáo viên xem trẻ vắng không phép hôm nay của lớp mình và ghi kết quả liên
// hệ người đón; Admin xem danh sách cần xử lý của hôm nay. Ba route không chung tiền tố nên route gốc
// là api/ và Roles gắn theo từng action; [Authorize] ở mức class để action nào quên gắn Roles vẫn bắt
// đăng nhập. Lần liên hệ đã ghi không sửa, không xóa (BR-ATTENDANCE-07)
[ApiController]
[Route("api")]
[Authorize]
public class AbsenceFollowUpsController : ControllerBase
{
    private readonly IAbsenceFollowUpService _absenceFollowUpService;
    private readonly IValidator<CreateAbsenceFollowUpRequest> _createValidator;

    public AbsenceFollowUpsController(
        IAbsenceFollowUpService absenceFollowUpService,
        IValidator<CreateAbsenceFollowUpRequest> createValidator)
    {
        _absenceFollowUpService = absenceFollowUpService;
        _createValidator = createValidator;
    }

    [HttpGet("absence-follow-ups/today")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AbsenceTodayResponse>>>> GetToday()
    {
        var result = await _absenceFollowUpService.GetTodayForTeacherAsync(CurrentUserId());
        return Ok(ApiResponse<IReadOnlyList<AbsenceTodayResponse>>.Ok(result));
    }

    // Không có route xem riêng một lần liên hệ nên 201 không kèm Location (api-conventions §4)
    [HttpPost("attendances/{id:guid}/follow-ups")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<AbsenceFollowUpResponse>>> Create(
        Guid id, [FromBody] CreateAbsenceFollowUpRequest request)
    {
        var validationResult = await _createValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<AbsenceFollowUpResponse>.Fail(errors));
        }

        var result = await _absenceFollowUpService.CreateAsync(id, request, CurrentUserId());

        return result.Outcome switch
        {
            AbsenceFollowUpOutcome.Success => StatusCode(StatusCodes.Status201Created,
                ApiResponse<AbsenceFollowUpResponse>.Ok(result.FollowUp!)),
            AbsenceFollowUpOutcome.AttendanceNotFound => NotFound(
                ApiResponse<AbsenceFollowUpResponse>.Fail("Không tìm thấy bản ghi điểm danh.")),
            AbsenceFollowUpOutcome.NotUnexcusedToday => Conflict(ApiResponse<AbsenceFollowUpResponse>.Fail(
                "Chỉ ghi kết quả liên hệ cho trẻ vắng không phép của hôm nay.")),
            _ => throw new InvalidOperationException($"Kết quả ghi liên hệ không xử lý: {result.Outcome}")
        };
    }

    [HttpGet("absence-escalations/today")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AbsenceEscalationResponse>>>> GetTodayEscalations()
    {
        var result = await _absenceFollowUpService.GetTodayEscalationsAsync();
        return Ok(ApiResponse<IReadOnlyList<AbsenceEscalationResponse>>.Ok(result));
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
