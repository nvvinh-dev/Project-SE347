using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Health;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Sức khỏe gồm nhiều tài nguyên do nhiều vai trò dùng (giáo viên ghi sức khỏe nhanh, Y tế ghi
// số đo), nên route gốc là api/ và Roles gắn theo từng action. [Authorize] ở mức class để action
// nào quên gắn Roles vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-HEALTH-01: chỉ Giáo viên tạo bản ghi sức khỏe nhanh (BR-HEALTH-01), và chỉ cho trẻ lớp mình
// chủ nhiệm (D40 mục 2). Bản ghi đã tạo không sửa, không xóa.
// FR-HEALTH-07: Giáo viên xem lưu ý sức khỏe của trẻ lớp mình chủ nhiệm, chỉ xem (BR-HEALTH-08).
// FR-HEALTH-02, FR-HEALTH-03: chỉ Y tế tạo và xem số đo chiều cao, cân nặng (BR-HEALTH-02), cho trẻ
// toàn trường (D43 mục 2). Số đo đã tạo không sửa, không xóa
// Danh sách trẻ cho Y tế chọn: chỉ Y tế, trẻ toàn trường, kèm lưu ý sức khỏe nhưng không kèm lớp
// (D40 mục 3, D45). FR-HEALTH-04 và FR-HEALTH-06 dùng lại danh sách này
// FR-HEALTH-04: chỉ Y tế xem lịch sử gộp sự cố, sức khỏe nhanh và số đo của trẻ toàn trường
// (BR-HEALTH-04); vai trò khác → 403 (AC-HEALTH-08), phụ huynh xem con mình qua FR-HEALTH-05
// FR-HEALTH-05: Phụ huynh xem lưu ý sức khỏe, sức khỏe nhanh và số đo của con mình (child_guardians,
// D39 mục 10) qua một route riêng, chỉ đọc (BR-HEALTH-06); các route tạo, xem của Giáo viên và Y tế ở
// trên không mở cho phụ huynh
// FR-HEALTH-06: chỉ Y tế ghi, sửa hoặc xóa trắng lưu ý sức khỏe của trẻ toàn trường (BR-HEALTH-07);
// vai trò khác, kể cả giáo viên chủ nhiệm và phụ huynh của trẻ → 403 (AC-HEALTH-12, AC-HEALTH-15)
[ApiController]
[Route("api")]
[Authorize]
public class HealthController : ControllerBase
{
    private readonly IHealthService _healthService;
    private readonly IValidator<QuickHealthStatusRequest> _quickHealthStatusValidator;
    private readonly IValidator<GrowthMeasurementRequest> _growthMeasurementValidator;
    private readonly IValidator<UpdateHealthNotesRequest> _updateHealthNotesValidator;

    public HealthController(
        IHealthService healthService,
        IValidator<QuickHealthStatusRequest> quickHealthStatusValidator,
        IValidator<GrowthMeasurementRequest> growthMeasurementValidator,
        IValidator<UpdateHealthNotesRequest> updateHealthNotesValidator)
    {
        _healthService = healthService;
        _quickHealthStatusValidator = quickHealthStatusValidator;
        _growthMeasurementValidator = growthMeasurementValidator;
        _updateHealthNotesValidator = updateHealthNotesValidator;
    }

    [HttpGet("quick-health-statuses/{id:guid}")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<QuickHealthStatusResponse>>> GetQuickHealthStatusById(Guid id)
    {
        var result = await _healthService.GetQuickHealthStatusByIdAsync(id, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<QuickHealthStatusResponse>.Fail("Không tìm thấy bản ghi sức khỏe."));

        return Ok(ApiResponse<QuickHealthStatusResponse>.Ok(result));
    }

    [HttpPost("quick-health-statuses")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<QuickHealthStatusResponse>>> CreateQuickHealthStatus(
        [FromBody] QuickHealthStatusRequest request)
    {
        var validationResult = await _quickHealthStatusValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<QuickHealthStatusResponse>.Fail(errors));
        }

        var result = await _healthService.CreateQuickHealthStatusAsync(request, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<QuickHealthStatusResponse>.Fail("Không tìm thấy trẻ."));

        return CreatedAtAction(nameof(GetQuickHealthStatusById), new { id = result.Id },
            ApiResponse<QuickHealthStatusResponse>.Ok(result));
    }

    // Trẻ của các lớp mình chủ nhiệm, mỗi trẻ chỉ có id, họ tên và lưu ý sức khỏe (D45). Màn hình
    // giáo viên cũng dùng danh sách này để chọn trẻ khi điểm danh; chưa được gán lớp thì danh sách rỗng
    [HttpGet("homeroom-children")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<HomeroomChildResponse>>>> GetHomeroomChildren()
    {
        var result = await _healthService.GetHomeroomChildrenAsync(CurrentUserId());
        return Ok(ApiResponse<IReadOnlyList<HomeroomChildResponse>>.Ok(result));
    }

    // Trẻ không tồn tại và trẻ lớp khác cùng trả 404 (AC-HEALTH-17)
    [HttpGet("homeroom-children/{childId:guid}")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<HomeroomChildResponse>>> GetHomeroomChildById(Guid childId)
    {
        var result = await _healthService.GetHomeroomChildByIdAsync(childId, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<HomeroomChildResponse>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<HomeroomChildResponse>.Ok(result));
    }

    // Mọi trẻ trong trường, sắp theo họ tên, không phân trang. Mỗi trẻ chỉ có id, họ tên, ngày sinh và
    // lưu ý sức khỏe (D45); Kế toán dùng GET api/children với DTO khác, không có lưu ý
    [HttpGet("school-children")]
    [Authorize(Roles = Roles.Medical)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SchoolChildResponse>>>> GetSchoolChildren()
    {
        var result = await _healthService.GetSchoolChildrenAsync();
        return Ok(ApiResponse<IReadOnlyList<SchoolChildResponse>>.Ok(result));
    }

    // Trẻ cùng dạng với danh sách trên, kèm lịch sử gộp mới nhất trước (D39 mục 9); trẻ chưa có bản ghi
    // nào thì items rỗng. Trẻ toàn trường nên chỉ trẻ không tồn tại mới 404
    [HttpGet("school-children/{childId:guid}/health-history")]
    [Authorize(Roles = Roles.Medical)]
    public async Task<ActionResult<ApiResponse<HealthHistoryResponse>>> GetHealthHistory(Guid childId)
    {
        var result = await _healthService.GetHealthHistoryAsync(childId);

        if (result is null)
            return NotFound(ApiResponse<HealthHistoryResponse>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<HealthHistoryResponse>.Ok(result));
    }

    // Ghi đè toàn bộ lưu ý; gửi rỗng là xóa trắng (AC-HEALTH-14). Trả trẻ sau khi sửa, cùng dạng với
    // school-children. Trẻ toàn trường nên chỉ trẻ không tồn tại mới 404 (UC-HEALTH-05 E3)
    [HttpPut("children/{childId:guid}/health-notes")]
    [Authorize(Roles = Roles.Medical)]
    public async Task<ActionResult<ApiResponse<SchoolChildResponse>>> UpdateHealthNotes(
        Guid childId, [FromBody] UpdateHealthNotesRequest request)
    {
        var validationResult = await _updateHealthNotesValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<SchoolChildResponse>.Fail(errors));
        }

        var result = await _healthService.UpdateHealthNotesAsync(childId, request);

        if (result is null)
            return NotFound(ApiResponse<SchoolChildResponse>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<SchoolChildResponse>.Ok(result));
    }

    // Lưu ý sức khỏe kèm sức khỏe nhanh và số đo, mỗi danh sách mới nhất trước; con mình chưa có bản ghi
    // nào thì hai danh sách rỗng. Trẻ không tồn tại và trẻ không liên kết với mình cùng trả 404
    // (AC-HEALTH-11). Phụ huynh gọi các route tạo bản ghi của controller này thì 403 (AC-HEALTH-12)
    [HttpGet("children/{childId:guid}/health")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<ChildHealthResponse>>> GetChildHealth(Guid childId)
    {
        var result = await _healthService.GetChildHealthForGuardianAsync(childId, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<ChildHealthResponse>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<ChildHealthResponse>.Ok(result));
    }

    // Lịch sử số đo của một trẻ, mới nhất trước; trẻ chưa có số đo nào thì danh sách rỗng
    [HttpGet("children/{childId:guid}/growth-measurements")]
    [Authorize(Roles = Roles.Medical)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GrowthMeasurementResponse>>>> GetGrowthMeasurements(
        Guid childId)
    {
        var result = await _healthService.GetGrowthMeasurementsOfChildAsync(childId);

        if (result is null)
            return NotFound(ApiResponse<IReadOnlyList<GrowthMeasurementResponse>>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<IReadOnlyList<GrowthMeasurementResponse>>.Ok(result));
    }

    [HttpGet("growth-measurements/{id:guid}")]
    [Authorize(Roles = Roles.Medical)]
    public async Task<ActionResult<ApiResponse<GrowthMeasurementResponse>>> GetGrowthMeasurementById(Guid id)
    {
        var result = await _healthService.GetGrowthMeasurementByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<GrowthMeasurementResponse>.Fail("Không tìm thấy số đo."));

        return Ok(ApiResponse<GrowthMeasurementResponse>.Ok(result));
    }

    // Một lần đo ghi chiều cao, cân nặng hoặc cả hai; trống cả hai → 400 (AC-HEALTH-07)
    [HttpPost("children/{childId:guid}/growth-measurements")]
    [Authorize(Roles = Roles.Medical)]
    public async Task<ActionResult<ApiResponse<GrowthMeasurementResponse>>> CreateGrowthMeasurement(
        Guid childId, [FromBody] GrowthMeasurementRequest request)
    {
        var validationResult = await _growthMeasurementValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<GrowthMeasurementResponse>.Fail(errors));
        }

        var result = await _healthService.CreateGrowthMeasurementAsync(childId, request, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<GrowthMeasurementResponse>.Fail("Không tìm thấy trẻ."));

        return CreatedAtAction(nameof(GetGrowthMeasurementById), new { id = result.Id },
            ApiResponse<GrowthMeasurementResponse>.Ok(result));
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
