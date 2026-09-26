using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.API.Controllers;

// Module Học phí (architecture.md §16) gồm hai tài nguyên tuition-fees và invoices,
// nên route gốc của Controller là api/ và mỗi action tự ghi tên tài nguyên.
// FR-TUITION-01: chỉ Kế toán quản lý biểu phí (Tạo + Sửa + Xem, không Xóa — D40 mục 1)
[ApiController]
[Route("api")]
[Authorize(Roles = Roles.Accountant)]
public class TuitionController : ControllerBase
{
    private readonly ITuitionService _tuitionService;
    private readonly IValidator<TuitionFeeRequest> _tuitionFeeValidator;

    public TuitionController(
        ITuitionService tuitionService,
        IValidator<TuitionFeeRequest> tuitionFeeValidator)
    {
        _tuitionService = tuitionService;
        _tuitionFeeValidator = tuitionFeeValidator;
    }

    [HttpGet("tuition-fees")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TuitionFeeResponse>>>> GetFees()
    {
        var result = await _tuitionService.GetFeesAsync();
        return Ok(ApiResponse<IReadOnlyList<TuitionFeeResponse>>.Ok(result));
    }

    [HttpGet("tuition-fees/{id:guid}")]
    public async Task<ActionResult<ApiResponse<TuitionFeeResponse>>> GetFeeById(Guid id)
    {
        var result = await _tuitionService.GetFeeByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<TuitionFeeResponse>.Fail("Không tìm thấy biểu phí."));

        return Ok(ApiResponse<TuitionFeeResponse>.Ok(result));
    }

    [HttpPost("tuition-fees")]
    public async Task<ActionResult<ApiResponse<TuitionFeeResponse>>> CreateFee([FromBody] TuitionFeeRequest request)
    {
        var validationResult = await _tuitionFeeValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<TuitionFeeResponse>.Fail(errors));
        }

        var result = await _tuitionService.CreateFeeAsync(request);

        if (result is null)
            return Conflict(ApiResponse<TuitionFeeResponse>.Fail(
                "Trường đã có biểu phí. Hãy sửa mức phí hiện có thay vì tạo mới."));

        return CreatedAtAction(nameof(GetFeeById), new { id = result.Id },
            ApiResponse<TuitionFeeResponse>.Ok(result));
    }

    [HttpPut("tuition-fees/{id:guid}")]
    public async Task<ActionResult<ApiResponse<TuitionFeeResponse>>> UpdateFee(Guid id, [FromBody] TuitionFeeRequest request)
    {
        var validationResult = await _tuitionFeeValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<TuitionFeeResponse>.Fail(errors));
        }

        var result = await _tuitionService.UpdateFeeAsync(id, request);

        if (result is null)
            return NotFound(ApiResponse<TuitionFeeResponse>.Fail("Không tìm thấy biểu phí."));

        return Ok(ApiResponse<TuitionFeeResponse>.Ok(result));
    }
}
