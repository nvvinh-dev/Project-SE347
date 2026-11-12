using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Notifications;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Thông báo phục vụ nhiều vai trò (Phụ huynh, Y tế, Admin xem; Kế toán phát thông báo nghỉ học ở
// FR-NOTI-03), nên Roles gắn theo từng action. [Authorize] ở mức class để action nào quên gắn Roles
// vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-NOTI-01, FR-NOTI-02: Phụ huynh và Y tế xem thông báo gửi cho chính mình (BR-NOTIFICATION-02);
// FR-NOTI-04: Admin xem thông báo phản ánh mới gửi cho chính mình qua cùng route.
// Giáo viên, Kế toán không nhận thông báo → 403 (AC-NOTI-05). Client không tạo thông báo:
// module phát sinh sự kiện ghi qua INotificationService (D39 mục 6).
// FR-NOTI-03: chỉ Kế toán phát thông báo nghỉ học, Kế toán chỉ nhập nội dung (BR-NOTIFICATION-03).
[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IValidator<NotificationListQuery> _listQueryValidator;
    private readonly IValidator<SchoolClosureRequest> _schoolClosureValidator;

    public NotificationsController(
        INotificationService notificationService,
        IValidator<NotificationListQuery> listQueryValidator,
        IValidator<SchoolClosureRequest> schoolClosureValidator)
    {
        _notificationService = notificationService;
        _listQueryValidator = listQueryValidator;
        _schoolClosureValidator = schoolClosureValidator;
    }

    // Không có xem theo id: danh sách đã đủ nội dung, thông báo không có trạng thái đã đọc và không
    // trỏ tới bản ghi gây ra nó (D25)
    [HttpGet]
    [Authorize(Roles = $"{Roles.Parent},{Roles.Medical},{Roles.Admin}")]
    public async Task<ActionResult<ApiResponse<NotificationPageResponse>>> GetMine(
        [FromQuery] NotificationListQuery query)
    {
        var validationResult = await _listQueryValidator.ValidateAsync(query);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<NotificationPageResponse>.Fail(errors));
        }

        var result = await _notificationService.GetMyNotificationsAsync(CurrentUserId(), query);
        return Ok(ApiResponse<NotificationPageResponse>.Ok(result));
    }

    // Trả 200 thay vì 201: một lần phát tạo nhiều thông báo và không có route xem lại để đặt Location.
    // Thông báo đã gửi không sửa, không thu hồi được nên không có PUT hay DELETE
    [HttpPost("school-closures")]
    [Authorize(Roles = Roles.Accountant)]
    public async Task<ActionResult<ApiResponse<SchoolClosureResponse>>> BroadcastSchoolClosure(
        [FromBody] SchoolClosureRequest request)
    {
        var validationResult = await _schoolClosureValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<SchoolClosureResponse>.Fail(errors));
        }

        var result = await _notificationService.BroadcastSchoolClosureAsync(request);
        return Ok(ApiResponse<SchoolClosureResponse>.Ok(result, "Đã phát thông báo nghỉ học."));
    }

    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
