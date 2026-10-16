using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Teachers;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.API.Controllers;

// Hồ sơ giáo viên gồm hai tài nguyên teachers và teacher-accounts (tài khoản để chọn), nên route gốc
// của Controller là api/ và mỗi action tự ghi tên tài nguyên.
// FR-TEACHER-01: chỉ Kế toán tạo và xem hồ sơ giáo viên; không sửa, không xóa (D40 mục 1)
[ApiController]
[Route("api")]
[Authorize(Roles = Roles.Accountant)]
public class TeachersController : ControllerBase
{
    private readonly ITeacherService _teacherService;
    private readonly IValidator<CreateTeacherRequest> _createTeacherValidator;

    public TeachersController(
        ITeacherService teacherService,
        IValidator<CreateTeacherRequest> createTeacherValidator)
    {
        _teacherService = teacherService;
        _createTeacherValidator = createTeacherValidator;
    }

    [HttpGet("teachers")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TeacherResponse>>>> GetAll()
    {
        var result = await _teacherService.GetAllAsync();
        return Ok(ApiResponse<IReadOnlyList<TeacherResponse>>.Ok(result));
    }

    [HttpGet("teachers/{id:guid}")]
    public async Task<ActionResult<ApiResponse<TeacherResponse>>> GetById(Guid id)
    {
        var result = await _teacherService.GetByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<TeacherResponse>.Fail("Không tìm thấy hồ sơ giáo viên."));

        return Ok(ApiResponse<TeacherResponse>.Ok(result));
    }

    // Chỉ tài khoản Giáo viên đang hoạt động chưa có hồ sơ: danh sách để Kế toán chọn khi tạo hồ sơ
    [HttpGet("teacher-accounts")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TeacherAccountResponse>>>> GetAccountsWithoutProfile()
    {
        var result = await _teacherService.GetAccountsWithoutProfileAsync();
        return Ok(ApiResponse<IReadOnlyList<TeacherAccountResponse>>.Ok(result));
    }

    [HttpPost("teachers")]
    public async Task<ActionResult<ApiResponse<TeacherResponse>>> Create([FromBody] CreateTeacherRequest request)
    {
        var validationResult = await _createTeacherValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<TeacherResponse>.Fail(errors));
        }

        var result = await _teacherService.CreateAsync(request);

        return result.Outcome switch
        {
            TeacherOutcome.Success => CreatedAtAction(nameof(GetById), new { id = result.Teacher!.Id },
                ApiResponse<TeacherResponse>.Ok(result.Teacher)),
            // Cùng mức 400 với tài khoản không hợp lệ khi liên kết phụ huynh–trẻ (FR-STU-02)
            TeacherOutcome.InvalidTeacherAccount => BadRequest(ApiResponse<TeacherResponse>.Fail(
                "Tài khoản được chọn không phải tài khoản Giáo viên đang hoạt động.")),
            TeacherOutcome.ProfileExists => Conflict(ApiResponse<TeacherResponse>.Fail(
                "Tài khoản này đã có hồ sơ giáo viên.")),
            _ => throw new InvalidOperationException($"Kết quả tạo hồ sơ giáo viên không xử lý: {result.Outcome}")
        };
    }
}
