using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Children;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Liên kết phụ huynh–trẻ gồm hai tài nguyên parent-accounts (tài khoản để chọn) và
// children/{childId}/guardians, nên route gốc của Controller là api/ và mỗi action tự ghi tên tài nguyên.
// Chỉ Kế toán tạo, xem và gỡ liên kết (FR-STU-02); Kế toán không tạo hay sửa tài khoản (D39 mục 16)
[ApiController]
[Route("api")]
[Authorize(Roles = Roles.Accountant)]
public class ChildGuardiansController : ControllerBase
{
    private readonly IChildGuardianService _childGuardianService;
    private readonly IValidator<LinkGuardianRequest> _linkGuardianValidator;

    public ChildGuardiansController(
        IChildGuardianService childGuardianService,
        IValidator<LinkGuardianRequest> linkGuardianValidator)
    {
        _childGuardianService = childGuardianService;
        _linkGuardianValidator = linkGuardianValidator;
    }

    // Tìm theo họ tên hoặc email, không phân biệt hoa thường; không có search thì trả mọi tài khoản
    // Phụ huynh đang hoạt động
    [HttpGet("parent-accounts")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GuardianResponse>>>> SearchParentAccounts(
        [FromQuery] string? search)
    {
        var result = await _childGuardianService.SearchParentAccountsAsync(search);
        return Ok(ApiResponse<IReadOnlyList<GuardianResponse>>.Ok(result));
    }

    [HttpGet("children/{childId:guid}/guardians")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GuardianResponse>>>> GetGuardians(Guid childId)
    {
        var result = await _childGuardianService.GetGuardiansAsync(childId);

        if (result is null)
            return NotFound(ApiResponse<IReadOnlyList<GuardianResponse>>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<IReadOnlyList<GuardianResponse>>.Ok(result));
    }

    [HttpPost("children/{childId:guid}/guardians")]
    public async Task<ActionResult<ApiResponse<GuardianResponse>>> Link(
        Guid childId, [FromBody] LinkGuardianRequest request)
    {
        var validationResult = await _linkGuardianValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<GuardianResponse>.Fail(errors));
        }

        var result = await _childGuardianService.LinkAsync(childId, request, GetActorUserId());

        return result.Outcome switch
        {
            GuardianLinkOutcome.Success => CreatedAtAction(nameof(GetGuardians), new { childId },
                ApiResponse<GuardianResponse>.Ok(result.Guardian!)),
            GuardianLinkOutcome.ChildNotFound => NotFound(ApiResponse<GuardianResponse>.Fail("Không tìm thấy trẻ.")),
            // AC-STU-04 và UC-STU-02 (E2) chốt 400 cho tài khoản không phải Phụ huynh đang hoạt động
            GuardianLinkOutcome.InvalidGuardian => BadRequest(ApiResponse<GuardianResponse>.Fail(
                "Tài khoản được chọn không phải tài khoản Phụ huynh đang hoạt động.")),
            GuardianLinkOutcome.AlreadyLinked => Conflict(ApiResponse<GuardianResponse>.Fail(
                "Phụ huynh này đã được liên kết với trẻ.")),
            _ => throw new InvalidOperationException($"Kết quả liên kết phụ huynh không xử lý: {result.Outcome}")
        };
    }

    // Ngoại lệ Xóa của D40 mục 1: chỉ xóa dòng liên kết, dữ liệu của trẻ giữ nguyên
    [HttpDelete("children/{childId:guid}/guardians/{guardianUserId:guid}")]
    public async Task<ActionResult<ApiResponse<GuardianResponse>>> Unlink(Guid childId, Guid guardianUserId)
    {
        var result = await _childGuardianService.UnlinkAsync(childId, guardianUserId, GetActorUserId());

        return result.Outcome switch
        {
            GuardianLinkOutcome.Success => Ok(ApiResponse<GuardianResponse>.Ok(result.Guardian!)),
            GuardianLinkOutcome.ChildNotFound => NotFound(ApiResponse<GuardianResponse>.Fail("Không tìm thấy trẻ.")),
            GuardianLinkOutcome.LinkNotFound => NotFound(ApiResponse<GuardianResponse>.Fail(
                "Không tìm thấy liên kết giữa phụ huynh và trẻ này.")),
            _ => throw new InvalidOperationException($"Kết quả gỡ liên kết phụ huynh không xử lý: {result.Outcome}")
        };
    }

    // Người thực hiện lấy từ token, không nhận từ client (D44). ActiveUserMiddleware đã kiểm tra
    // claim sub là Guid hợp lệ trước khi vào đây
    private Guid GetActorUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
