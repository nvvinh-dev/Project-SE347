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
// đăng nhập: Program.cs không có fallback policy.
// FR-INCIDENT-02: Giáo viên đính thêm ảnh vào sự cố của trẻ lớp mình, cùng phạm vi; ảnh đã đính không xóa.
// FR-HEALTH-04: Y tế mở sự cố của mọi trẻ trong trường để xem ảnh, không đính ảnh (D39 mục 9).
// FR-INCIDENT-03 thêm action vào đây
[ApiController]
[Route("api/incidents")]
[Authorize]
public class IncidentsController : ControllerBase
{
    // 5 ảnh, mỗi ảnh tối đa 5 MB. Đặt cao hơn 6 ảnh 5 MB để ảnh thừa hay ảnh quá cỡ vẫn tới validator và nhận
    // message riêng (AC-INCIDENT-06 a, b). Quá mức này Kestrel dừng đọc body, model binding báo lỗi và
    // Program.cs trả 400 "Dữ liệu gửi lên không đọc được", không đọc hết body vào máy chủ
    private const long MultipartRequestSizeLimitBytes = 40 * 1024 * 1024;

    private readonly IIncidentService _incidentService;
    private readonly IValidator<CreateIncidentRequest> _createIncidentValidator;
    private readonly IValidator<AttachIncidentPhotosRequest> _attachIncidentPhotosValidator;

    public IncidentsController(IIncidentService incidentService, IValidator<CreateIncidentRequest> createIncidentValidator,
        IValidator<AttachIncidentPhotosRequest> attachIncidentPhotosValidator)
    {
        _incidentService = incidentService;
        _createIncidentValidator = createIncidentValidator;
        _attachIncidentPhotosValidator = attachIncidentPhotosValidator;
    }

    // Giáo viên: sự cố không tồn tại và sự cố của trẻ lớp khác cùng trả 404. Y tế: chỉ sự cố không tồn tại
    // mới 404 (AC-HEALTH-18). Ảnh trả kèm URL ký hạn 60 phút (D53)
    [HttpGet("{id:guid}")]
    [Authorize(Roles = Roles.Teacher + "," + Roles.Medical)]
    public async Task<ActionResult<ApiResponse<IncidentResponse>>> GetById(Guid id)
    {
        // Nhánh còn lại là nhánh giáo viên. Thêm vai trò vào Roles của action này thì phải thêm nhánh cho
        // vai trò đó; nếu không, vai trò mới bị lọc theo lớp chủ nhiệm và luôn nhận 404
        var result = User.IsInRole(Roles.Medical)
            ? await _incidentService.GetIncidentForMedicalAsync(id)
            : await _incidentService.GetIncidentByIdAsync(id, CurrentUserId());

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

    // Multipart: 1–5 ảnh ở trường photos (D39 mục 5). Trả sự cố kèm mọi ảnh đã đính, kể cả ảnh của các lần
    // trước. Sự cố không tồn tại và sự cố của trẻ lớp khác cùng trả 404 (AC-INCIDENT-05 b)
    [HttpPost("{id:guid}/photos")]
    [Authorize(Roles = Roles.Teacher)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MultipartRequestSizeLimitBytes)]
    public async Task<ActionResult<ApiResponse<IncidentResponse>>> AttachPhotos(Guid id, List<IFormFile>? photos)
    {
        var request = new AttachIncidentPhotosRequest(
            photos?.Select(f => new UploadedPhoto(f.FileName, f.ContentType, f.Length, f.OpenReadStream)).ToList()
                ?? new List<UploadedPhoto>());

        var validationResult = await _attachIncidentPhotosValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<IncidentResponse>.Fail(errors));
        }

        var result = await _incidentService.AttachPhotosAsync(id, request, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<IncidentResponse>.Fail("Không tìm thấy sự cố."));

        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<IncidentResponse>.Ok(result));
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
