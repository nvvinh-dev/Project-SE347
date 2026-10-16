using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Attendance;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Điểm danh phục vụ hai vai trò trên hai route (giáo viên dùng api/attendances, phụ huynh
// xem theo con ở api/children/{childId}/attendances), nên route gốc là api/ và Roles gắn theo từng
// action. [Authorize] ở mức class để action nào quên gắn Roles vẫn bắt đăng nhập: Program.cs không
// có fallback policy.
// FR-ATT-01: chỉ Giáo viên tạo điểm danh vào lớp (BR-ATTENDANCE-01), và chỉ cho trẻ lớp mình
// chủ nhiệm (D40 mục 2). Bản ghi đã tạo không sửa, không xóa (BR-ATTENDANCE-04).
// FR-ATT-03: Giáo viên xem lịch sử điểm danh, cùng phạm vi lớp chủ nhiệm.
// FR-ATT-02: Phụ huynh xem lịch sử điểm danh của con mình (child_guardians, D39 mục 10)
[ApiController]
[Route("api")]
[Authorize]
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
    [HttpGet("attendances")]
    [Authorize(Roles = Roles.Teacher)]
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

    // Trẻ không tồn tại và trẻ không liên kết với mình cùng trả 404 (AC-ATT-04); con mình chưa có
    // bản ghi nào thì danh sách rỗng (UC-ATT-02)
    [HttpGet("children/{childId:guid}/attendances")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ChildAttendanceResponse>>>> GetChildHistory(Guid childId)
    {
        var result = await _attendanceService.GetChildHistoryForGuardianAsync(childId, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<IReadOnlyList<ChildAttendanceResponse>>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<IReadOnlyList<ChildAttendanceResponse>>.Ok(result));
    }

    [HttpGet("attendances/{id:guid}")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<AttendanceResponse>>> GetById(Guid id)
    {
        var result = await _attendanceService.GetByIdAsync(id, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<AttendanceResponse>.Fail("Không tìm thấy bản ghi điểm danh."));

        return Ok(ApiResponse<AttendanceResponse>.Ok(result));
    }

    [HttpPost("attendances")]
    [Authorize(Roles = Roles.Teacher)]
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
