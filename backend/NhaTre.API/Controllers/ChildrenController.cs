using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Children;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Hồ sơ trẻ phục vụ hai vai trò, nên Roles gắn theo từng action. [Authorize] ở mức class để action
// nào quên gắn Roles vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-STU-01: chỉ Kế toán quản lý hồ sơ trẻ (Tạo + Sửa + Xem, không Xóa — D40 mục 1)
// Phụ huynh chỉ xem danh sách con của mình (BR-SCOPE-01) để chọn trẻ ở các màn hình phụ huynh
[ApiController]
[Route("api/children")]
[Authorize]
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
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ChildResponse>>>> GetAll()
    {
        var result = await _childService.GetAllAsync();
        return Ok(ApiResponse<IReadOnlyList<ChildResponse>>.Ok(result));
    }

    // Chưa liên kết trẻ nào thì danh sách rỗng
    [HttpGet("mine")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MyChildResponse>>>> GetMine()
    {
        var result = await _childService.GetMineAsync(CurrentUserId());
        return Ok(ApiResponse<IReadOnlyList<MyChildResponse>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<ChildResponse>>> GetById(Guid id)
    {
        var result = await _childService.GetByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<ChildResponse>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<ChildResponse>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = Roles.Accountant)]
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
    [Authorize(Roles = Roles.Accountant)]
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

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
