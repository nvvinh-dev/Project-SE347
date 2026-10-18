using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Incidents;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// FR-INCIDENT-01: chỉ Giáo viên ghi sự cố (BR-INCIDENT-01), và chỉ cho trẻ lớp mình chủ nhiệm (D40 mục 2).
// Sự cố đã tạo không sửa mô tả, không xóa. [Authorize] ở mức class để action nào quên gắn Roles vẫn bắt
// đăng nhập: Program.cs không có fallback policy. FR-INCIDENT-02, FR-INCIDENT-03 thêm action vào đây
[ApiController]
[Route("api/incidents")]
[Authorize]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _incidentService;
    private readonly IValidator<CreateIncidentRequest> _createIncidentValidator;

    public IncidentsController(IIncidentService incidentService, IValidator<CreateIncidentRequest> createIncidentValidator)
    {
        _incidentService = incidentService;
        _createIncidentValidator = createIncidentValidator;
    }

    // Trẻ không tồn tại và sự cố của trẻ lớp khác cùng trả 404
    [HttpGet("{id:guid}")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<IncidentResponse>>> GetById(Guid id)
    {
        var result = await _incidentService.GetIncidentByIdAsync(id, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<IncidentResponse>.Fail("Không tìm thấy sự cố."));

        return Ok(ApiResponse<IncidentResponse>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<IncidentResponse>>> Create([FromBody] CreateIncidentRequest request)
    {
        var validationResult = await _createIncidentValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<IncidentResponse>.Fail(errors));
        }

        var result = await _incidentService.CreateIncidentAsync(request, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<IncidentResponse>.Fail("Không tìm thấy trẻ."));

        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<IncidentResponse>.Ok(result));
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
