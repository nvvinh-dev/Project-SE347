using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Notifications;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Thông báo phục vụ nhiều vai trò (Phụ huynh, Y tế xem; Kế toán phát thông báo nghỉ học ở
// FR-NOTI-03), nên Roles gắn theo từng action. [Authorize] ở mức class để action nào quên gắn Roles
// vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-NOTI-01, FR-NOTI-02: Phụ huynh và Y tế xem thông báo gửi cho chính mình (BR-NOTIFICATION-02);
// Admin, Giáo viên, Kế toán không nhận thông báo → 403 (AC-NOTI-05). Client không tạo thông báo:
// module phát sinh sự kiện ghi qua INotificationService (D39 mục 6).
[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IValidator<NotificationListQuery> _listQueryValidator;

    public NotificationsController(
        INotificationService notificationService,
        IValidator<NotificationListQuery> listQueryValidator)
    {
        _notificationService = notificationService;
        _listQueryValidator = listQueryValidator;
    }

    // Không có xem theo id: danh sách đã đủ nội dung, thông báo không có trạng thái đã đọc và không
    // trỏ tới bản ghi gây ra nó (D25)
    [HttpGet]
    [Authorize(Roles = Roles.Parent + "," + Roles.Medical)]
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

    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
