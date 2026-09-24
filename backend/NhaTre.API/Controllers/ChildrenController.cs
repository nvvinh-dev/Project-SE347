using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Children;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.API.Controllers;

// FR-STU-01: chỉ Kế toán quản lý hồ sơ trẻ (Tạo + Sửa + Xem, không Xóa — D40 mục 1)
[ApiController]
[Route("api/children")]
[Authorize(Roles = Roles.Accountant)]
public class ChildrenController : ControllerBase
{
    private readonly IChildService _childService;
    private readonly IValidator<ChildProfileRequest> _childProfileValidator;

    public ChildrenController(
        IChildService childService,
        IValidator<ChildProfileRequest> childProfileValidator)
    {
        _childService = childService;
        _childProfileValidator = childProfileValidator;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ChildResponse>>>> GetAll()
    {
        var result = await _childService.GetAllAsync();
        return Ok(ApiResponse<IReadOnlyList<ChildResponse>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ChildResponse>>> GetById(Guid id)
    {
        var result = await _childService.GetByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<ChildResponse>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<ChildResponse>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ChildResponse>>> Create([FromBody] ChildProfileRequest request)
    {
        var validationResult = await _childProfileValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<ChildResponse>.Fail(errors));
        }

        var result = await _childService.CreateAsync(request);

        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<ChildResponse>.Ok(result));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ChildResponse>>> Update(Guid id, [FromBody] ChildProfileRequest request)
    {
        var validationResult = await _childProfileValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<ChildResponse>.Fail(errors));
        }

        var result = await _childService.UpdateAsync(id, request);

        if (result is null)
            return NotFound(ApiResponse<ChildResponse>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<ChildResponse>.Ok(result));
    }
}
