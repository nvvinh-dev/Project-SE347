using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Attendance;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// FR-ATT-01: chỉ Giáo viên tạo điểm danh vào lớp (BR-ATTENDANCE-01), và chỉ cho trẻ lớp mình
// chủ nhiệm (D40 mục 2). Bản ghi đã tạo không sửa, không xóa (BR-ATTENDANCE-04).
// FR-ATT-03: Giáo viên xem lịch sử điểm danh, cùng phạm vi lớp chủ nhiệm
[ApiController]
[Route("api/attendances")]
[Authorize(Roles = Roles.Teacher)]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;
    private readonly IValidator<CheckInRequest> _checkInValidator;

    public AttendanceController(
        IAttendanceService attendanceService,
        IValidator<CheckInRequest> checkInValidator)
    {
        _attendanceService = attendanceService;
        _checkInValidator = checkInValidator;
    }

    // Chọn theo trẻ, theo ngày hoặc cả hai (UC-ATT-03); classId chỉ để thu hẹp khi giáo viên chủ
    // nhiệm nhiều lớp. Không chọn trẻ hay ngày thì 400 để không trả cả lịch sử của mọi lớp
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AttendanceResponse>>>> GetHistory(
        [FromQuery] Guid? childId, [FromQuery] Guid? classId, [FromQuery] DateOnly? date)
    {
        if (childId is null && date is null)
            return BadRequest(ApiResponse<IReadOnlyList<AttendanceResponse>>.Fail(
                new[] { "Cần chọn trẻ (childId) hoặc ngày (date) để xem lịch sử điểm danh." }));

        var result = await _attendanceService.GetHistoryAsync(childId, classId, date, CurrentUserId());

        return result.Outcome switch
        {
            AttendanceHistoryOutcome.Success => Ok(ApiResponse<IReadOnlyList<AttendanceResponse>>.Ok(result.Attendances!)),
            AttendanceHistoryOutcome.ClassNotFound => NotFound(
                ApiResponse<IReadOnlyList<AttendanceResponse>>.Fail("Không tìm thấy lớp học.")),
            AttendanceHistoryOutcome.ChildNotFound => NotFound(
                ApiResponse<IReadOnlyList<AttendanceResponse>>.Fail("Không tìm thấy trẻ.")),
            _ => throw new InvalidOperationException($"Kết quả xem lịch sử điểm danh không xử lý: {result.Outcome}")
        };
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<AttendanceResponse>>> GetById(Guid id)
    {
        var result = await _attendanceService.GetByIdAsync(id, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<AttendanceResponse>.Fail("Không tìm thấy bản ghi điểm danh."));

        return Ok(ApiResponse<AttendanceResponse>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AttendanceResponse>>> CheckIn([FromBody] CheckInRequest request)
    {
        var validationResult = await _checkInValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<AttendanceResponse>.Fail(errors));
        }

        var result = await _attendanceService.CheckInAsync(request, CurrentUserId());

        return result.Outcome switch
        {
            AttendanceOutcome.Success => CreatedAtAction(nameof(GetById), new { id = result.Attendance!.Id },
                ApiResponse<AttendanceResponse>.Ok(result.Attendance)),
            AttendanceOutcome.ChildNotFound => NotFound(ApiResponse<AttendanceResponse>.Fail("Không tìm thấy trẻ.")),
            AttendanceOutcome.AlreadyCheckedIn => Conflict(ApiResponse<AttendanceResponse>.Fail(
                "Trẻ đã được điểm danh hôm nay. Bản điểm danh đã ghi không sửa được.")),
            _ => throw new InvalidOperationException($"Kết quả điểm danh không xử lý: {result.Outcome}")
        };
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
