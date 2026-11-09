using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Complaints;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Phản ánh gồm hai tài nguyên: phản ánh theo con của phụ huynh (children/{childId}/complaints) và
// phản ánh Admin xử lý (complaints), nên route gốc của Controller là api/ và mỗi action tự ghi tên tài
// nguyên. Hai vai trò dùng chung nên Roles gắn theo từng action; [Authorize] ở mức class để action nào quên
// gắn Roles vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-COMPLAINT-01: chỉ Phụ huynh gửi và xem phản ánh của con mình (child_guardians, D39 mục 10, 18).
// Gửi xong không sửa, không xóa, nên không có PUT hay DELETE cho phụ huynh.
// FR-COMPLAINT-02: chỉ Admin xem mọi phản ánh và xử lý. Giáo viên, Kế toán, Y tế → 403 ở mọi route,
// kể cả phản ánh nói về chính mình (BR-COMPLAINT-03). Không ghi security_events (D50).
[ApiController]
[Route("api")]
[Authorize]
public class ComplaintsController : ControllerBase
{
    private readonly IComplaintService _complaintService;
    private readonly IValidator<CreateComplaintRequest> _createComplaintValidator;
    private readonly IValidator<ComplaintListQuery> _listQueryValidator;
    private readonly IValidator<HandleComplaintRequest> _handleComplaintValidator;

    public ComplaintsController(IComplaintService complaintService,
        IValidator<CreateComplaintRequest> createComplaintValidator,
        IValidator<ComplaintListQuery> listQueryValidator,
        IValidator<HandleComplaintRequest> handleComplaintValidator)
    {
        _complaintService = complaintService;
        _createComplaintValidator = createComplaintValidator;
        _listQueryValidator = listQueryValidator;
        _handleComplaintValidator = handleComplaintValidator;
    }

    // Trả 201 không kèm Location: phụ huynh chỉ có route xem danh sách phản ánh của con, không có route
    // xem một phản ánh (api-conventions.md §4). Trẻ không tồn tại và trẻ không liên kết cùng 404
    [HttpPost("children/{childId:guid}/complaints")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<ChildComplaintResponse>>> Create(Guid childId,
        [FromBody] CreateComplaintRequest request)
    {
        var validationResult = await _createComplaintValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<ChildComplaintResponse>.Fail(errors));
        }

        var result = await _complaintService.CreateComplaintAsync(childId, request, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<ChildComplaintResponse>.Fail("Không tìm thấy trẻ."));

        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ChildComplaintResponse>.Ok(result, "Đã gửi phản ánh tới Ban giám hiệu."));
    }

    // Trẻ không tồn tại và trẻ không liên kết với mình cùng trả 404; con mình chưa có phản ánh nào thì
    // danh sách rỗng
    [HttpGet("children/{childId:guid}/complaints")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ChildComplaintResponse>>>> GetChildComplaints(
        Guid childId)
    {
        var result = await _complaintService.GetChildComplaintsForGuardianAsync(childId, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<IReadOnlyList<ChildComplaintResponse>>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<IReadOnlyList<ChildComplaintResponse>>.Ok(result));
    }

    [HttpGet("complaints")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ApiResponse<ComplaintPageResponse>>> GetAll([FromQuery] ComplaintListQuery query)
    {
        var validationResult = await _listQueryValidator.ValidateAsync(query);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<ComplaintPageResponse>.Fail(errors));
        }

        var result = await _complaintService.GetComplaintsAsync(query);
        return Ok(ApiResponse<ComplaintPageResponse>.Ok(result));
    }

    // Phản ánh đã Resolved thì không đổi được nữa (→ 409), kể cả khi Admin khác vừa xử lý xong trước
    [HttpPut("complaints/{id:guid}/handling")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ApiResponse<ComplaintResponse>>> Handle(Guid id,
        [FromBody] HandleComplaintRequest request)
    {
        var validationResult = await _handleComplaintValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<ComplaintResponse>.Fail(errors));
        }

        var result = await _complaintService.HandleComplaintAsync(id, request, CurrentUserId());

        return result.Outcome switch
        {
            HandleComplaintOutcome.Success => Ok(ApiResponse<ComplaintResponse>.Ok(result.Complaint!,
                "Đã cập nhật xử lý phản ánh.")),
            HandleComplaintOutcome.ComplaintNotFound => NotFound(ApiResponse<ComplaintResponse>.Fail(
                "Không tìm thấy phản ánh.")),
            HandleComplaintOutcome.AlreadyResolved => Conflict(ApiResponse<ComplaintResponse>.Fail(
                "Phản ánh đã xử lý xong, không thay đổi được nữa.")),
            _ => throw new InvalidOperationException($"Kết quả xử lý phản ánh không xử lý: {result.Outcome}")
        };
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
