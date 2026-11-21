using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Menu;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.API.Controllers;

// FR-MENU-01: chỉ Kế toán tạo và sửa thực đơn tuần, không xóa (D40 mục 1).
// FR-MENU-02: Phụ huynh xem thực đơn tuần, chỉ đọc. Thực đơn áp dụng chung cho toàn trường nên không lọc
// theo trẻ hay lớp (BR-MENU-02): Kế toán và Phụ huynh dùng chung route xem, cùng một DTO.
// FR-MENU-03: mỗi ngày có thêm dị nguyên của món; Phụ huynh xem kèm childId thì biết ngày trùng dị ứng của con.
// Roles gắn theo từng action; [Authorize] ở mức class để action nào quên gắn Roles vẫn bắt đăng nhập
[ApiController]
[Route("api/weekly-menus")]
[Authorize]
public class MenuController : ControllerBase
{
    private readonly IMenuService _menuService;
    private readonly IValidator<CreateWeeklyMenuRequest> _createWeeklyMenuValidator;
    private readonly IValidator<UpdateWeeklyMenuRequest> _updateWeeklyMenuValidator;

    public MenuController(
        IMenuService menuService,
        IValidator<CreateWeeklyMenuRequest> createWeeklyMenuValidator,
        IValidator<UpdateWeeklyMenuRequest> updateWeeklyMenuValidator)
    {
        _menuService = menuService;
        _createWeeklyMenuValidator = createWeeklyMenuValidator;
        _updateWeeklyMenuValidator = updateWeeklyMenuValidator;
    }

    // Tuần chưa có thực đơn thì 404, không tạo bản ghi rỗng (UC-MENU-02 E1).
    // FR-MENU-03: Phụ huynh gửi thêm childId để biết ngày nào trùng dị nguyên của con; trẻ không phải con mình
    // → 404 (BR-SCOPE-01). Kế toán không được nhận dị nguyên của trẻ (D39 mục 19) nên gửi childId → 403
    [HttpGet]
    [Authorize(Roles = $"{Roles.Accountant},{Roles.Parent}")]
    public async Task<ActionResult<ApiResponse<WeeklyMenuResponse>>> GetByWeek(
        [FromQuery] DateOnly? weekStartDate, [FromQuery] Guid? childId)
    {
        if (weekStartDate is null)
            return BadRequest(ApiResponse<WeeklyMenuResponse>.Fail(
                new[] { "Cần chọn tuần (weekStartDate) để xem thực đơn." }));

        if (weekStartDate.Value.DayOfWeek != DayOfWeek.Monday)
            return BadRequest(ApiResponse<WeeklyMenuResponse>.Fail(
                new[] { "Ngày bắt đầu tuần phải là thứ Hai." }));

        if (childId is not null)
        {
            // Forbid đi qua JwtBearerEvents.OnForbidden nên vẫn trả khuôn ApiResponse như mọi 403 khác
            if (!User.IsInRole(Roles.Parent))
                return Forbid();

            var childResult = await _menuService.GetByWeekForChildAsync(
                weekStartDate.Value, CurrentUserId(), childId.Value);

            return childResult.Outcome switch
            {
                WeeklyMenuOutcome.ChildNotFound =>
                    NotFound(ApiResponse<WeeklyMenuResponse>.Fail("Không tìm thấy trẻ.")),
                WeeklyMenuOutcome.MenuNotFound =>
                    NotFound(ApiResponse<WeeklyMenuResponse>.Fail("Chưa có thực đơn cho tuần này.")),
                _ => Ok(ApiResponse<WeeklyMenuResponse>.Ok(childResult.Menu!))
            };
        }

        var result = await _menuService.GetByWeekAsync(weekStartDate.Value);

        if (result is null)
            return NotFound(ApiResponse<WeeklyMenuResponse>.Fail("Chưa có thực đơn cho tuần này."));

        return Ok(ApiResponse<WeeklyMenuResponse>.Ok(result));
    }

    [HttpPost]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<WeeklyMenuResponse>>> Create([FromBody] CreateWeeklyMenuRequest request)
    {
        var validationResult = await _createWeeklyMenuValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<WeeklyMenuResponse>.Fail(errors));
        }

        var result = await _menuService.CreateAsync(request);

        if (result is null)
            return Conflict(ApiResponse<WeeklyMenuResponse>.Fail(
                "Tuần này đã có thực đơn. Hãy sửa thực đơn đã có thay vì tạo mới."));

        // Thực đơn được tìm theo tuần nên Location trỏ về GET theo weekStartDate, ghi dạng yyyy-MM-dd
        return CreatedAtAction(nameof(GetByWeek),
            new { weekStartDate = result.WeekStartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) },
            ApiResponse<WeeklyMenuResponse>.Ok(result));
    }

    // Gửi lại đủ các ngày của tuần: ngày không gửi bị gỡ khỏi thực đơn. Không đổi được tuần
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<WeeklyMenuResponse>>> Update(Guid id, [FromBody] UpdateWeeklyMenuRequest request)
    {
        var validationResult = await _updateWeeklyMenuValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<WeeklyMenuResponse>.Fail(errors));
        }

        var result = await _menuService.UpdateAsync(id, request);

        if (result is null)
            return NotFound(ApiResponse<WeeklyMenuResponse>.Fail("Không tìm thấy thực đơn tuần."));

        return Ok(ApiResponse<WeeklyMenuResponse>.Ok(result));
    }

    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
