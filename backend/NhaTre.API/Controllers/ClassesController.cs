using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Classes;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.API.Controllers;

// Module Lớp gồm hai tài nguyên classes và class-placements (trẻ cần xếp lớp), nên route gốc của
// Controller là api/ và mỗi action tự ghi tên tài nguyên.
// Chỉ Admin xếp trẻ vào lớp và gán giáo viên chủ nhiệm (FR-CLASS-01). 3 lớp cố định (D39 mục 3):
// không có tạo, sửa hay xóa lớp
[ApiController]
[Route("api")]
[Authorize(Roles = Roles.Admin)]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;
    private readonly IValidator<AssignClassRequest> _assignClassValidator;
    private readonly IValidator<AssignHomeroomTeacherRequest> _assignHomeroomTeacherValidator;

    public ClassesController(
        IClassService classService,
        IValidator<AssignClassRequest> assignClassValidator,
        IValidator<AssignHomeroomTeacherRequest> assignHomeroomTeacherValidator)
    {
        _classService = classService;
        _assignClassValidator = assignClassValidator;
        _assignHomeroomTeacherValidator = assignHomeroomTeacherValidator;
    }

    [HttpGet("classes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ClassResponse>>>> GetClasses()
    {
        var result = await _classService.GetClassesAsync();
        return Ok(ApiResponse<IReadOnlyList<ClassResponse>>.Ok(result));
    }

    [HttpPut("classes/{id:guid}/homeroom-teacher")]
    public async Task<ActionResult<ApiResponse<ClassResponse>>> AssignHomeroomTeacher(
        Guid id, [FromBody] AssignHomeroomTeacherRequest request)
    {
        var validationResult = await _assignHomeroomTeacherValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<ClassResponse>.Fail(errors));
        }

        var result = await _classService.AssignHomeroomTeacherAsync(id, request);

        return result.Outcome switch
        {
            ClassOutcome.Success => Ok(ApiResponse<ClassResponse>.Ok(result.Class!)),
            ClassOutcome.ClassNotFound => NotFound(ApiResponse<ClassResponse>.Fail("Không tìm thấy lớp học.")),
            ClassOutcome.UserNotFound => NotFound(ApiResponse<ClassResponse>.Fail("Không tìm thấy tài khoản.")),
            ClassOutcome.NotTeacherRole => Conflict(ApiResponse<ClassResponse>.Fail(
                "Tài khoản này không có vai trò Giáo viên.")),
            ClassOutcome.TeacherInactive => Conflict(ApiResponse<ClassResponse>.Fail(
                "Tài khoản giáo viên này đang bị vô hiệu hóa.")),
            ClassOutcome.NoTeacherProfile => Conflict(ApiResponse<ClassResponse>.Fail(
                "Giáo viên này chưa có hồ sơ giáo viên. Kế toán cần lập hồ sơ trước khi phân công lớp.")),
            ClassOutcome.AlreadyHomeroom => Conflict(ApiResponse<ClassResponse>.Fail(
                "Giáo viên này đã là giáo viên chủ nhiệm của lớp.")),
            ClassOutcome.NoHomeroomTeacher => Conflict(ApiResponse<ClassResponse>.Fail(
                "Lớp này chưa có giáo viên chủ nhiệm.")),
            _ => throw new InvalidOperationException($"Kết quả gán giáo viên chủ nhiệm không xử lý: {result.Outcome}")
        };
    }

    // AC-CLASS-04: mỗi trẻ chỉ có họ tên, ngày sinh, lớp hiện tại
    [HttpGet("class-placements")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ClassPlacementResponse>>>> GetPlacements()
    {
        var result = await _classService.GetPlacementsAsync();
        return Ok(ApiResponse<IReadOnlyList<ClassPlacementResponse>>.Ok(result));
    }

    [HttpPut("class-placements/{childId:guid}")]
    public async Task<ActionResult<ApiResponse<ClassPlacementResponse>>> AssignClass(
        Guid childId, [FromBody] AssignClassRequest request)
    {
        var validationResult = await _assignClassValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<ClassPlacementResponse>.Fail(errors));
        }

        var result = await _classService.AssignClassAsync(childId, request);

        return result.Outcome switch
        {
            ClassOutcome.Success => Ok(ApiResponse<ClassPlacementResponse>.Ok(result.Placement!)),
            ClassOutcome.ChildNotFound => NotFound(ApiResponse<ClassPlacementResponse>.Fail("Không tìm thấy trẻ.")),
            ClassOutcome.ClassNotFound => NotFound(ApiResponse<ClassPlacementResponse>.Fail("Không tìm thấy lớp học.")),
            // AC-CLASS-03 và UC-CLASS-01 (E1) chốt 400 cho xếp sai nhóm tuổi
            ClassOutcome.AgeMismatch => BadRequest(ApiResponse<ClassPlacementResponse>.Fail(
                "Tuổi của trẻ không khớp độ tuổi của lớp này.")),
            ClassOutcome.AlreadyInClass => Conflict(ApiResponse<ClassPlacementResponse>.Fail("Trẻ đã ở lớp này.")),
            ClassOutcome.NotInAnyClass => Conflict(ApiResponse<ClassPlacementResponse>.Fail("Trẻ chưa được xếp lớp.")),
            ClassOutcome.ChildChanged => Conflict(ApiResponse<ClassPlacementResponse>.Fail(
                "Thông tin của trẻ vừa được cập nhật. Vui lòng tải lại rồi thử lại.")),
            _ => throw new InvalidOperationException($"Kết quả xếp lớp không xử lý: {result.Outcome}")
        };
    }
}
