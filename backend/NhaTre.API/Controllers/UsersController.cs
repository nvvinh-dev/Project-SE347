using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Users;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Chỉ Admin quản lý tài khoản (FR-USER-01): xem, tạo, sửa, vô hiệu hóa, mở lại, đặt lại mật khẩu;
// và đổi vai trò (FR-USER-02). Không có DELETE: tài khoản chỉ bị vô hiệu hóa, không xóa cứng (D39 mục 7)
[ApiController]
[Route("api/users")]
[Authorize(Roles = Roles.Admin)]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IValidator<CreateUserRequest> _createValidator;
    private readonly IValidator<UpdateUserRequest> _updateValidator;
    private readonly IValidator<ResetPasswordRequest> _resetPasswordValidator;
    private readonly IValidator<ChangeRoleRequest> _changeRoleValidator;

    public UsersController(
        IUserService userService,
        IValidator<CreateUserRequest> createValidator,
        IValidator<UpdateUserRequest> updateValidator,
        IValidator<ResetPasswordRequest> resetPasswordValidator,
        IValidator<ChangeRoleRequest> changeRoleValidator)
    {
        _userService = userService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _resetPasswordValidator = resetPasswordValidator;
        _changeRoleValidator = changeRoleValidator;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserResponse>>>> GetUsers()
    {
        var result = await _userService.GetUsersAsync();
        return Ok(ApiResponse<IReadOnlyList<UserResponse>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> GetUserById(Guid id)
    {
        var result = await _userService.GetUserByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<UserResponse>.Fail("Không tìm thấy tài khoản."));

        return Ok(ApiResponse<UserResponse>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserResponse>>> CreateUser([FromBody] CreateUserRequest request)
    {
        var validationResult = await _createValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<UserResponse>.Fail(errors));
        }

        var result = await _userService.CreateUserAsync(request);

        if (result.Outcome == UserOutcome.Success)
            return CreatedAtAction(nameof(GetUserById), new { id = result.User!.Id },
                ApiResponse<UserResponse>.Ok(result.User));

        return ToActionResult(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var validationResult = await _updateValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<UserResponse>.Fail(errors));
        }

        var result = await _userService.UpdateUserAsync(id, request);
        return ToActionResult(result);
    }

    [HttpPost("{id:guid}/deactivate")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> DeactivateUser(Guid id)
    {
        var result = await _userService.DeactivateUserAsync(id, GetActorUserId());
        return ToActionResult(result);
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> ActivateUser(Guid id)
    {
        var result = await _userService.ActivateUserAsync(id, GetActorUserId());
        return ToActionResult(result);
    }

    [HttpPost("{id:guid}/reset-password")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
    {
        var validationResult = await _resetPasswordValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<UserResponse>.Fail(errors));
        }

        var result = await _userService.ResetPasswordAsync(id, request, GetActorUserId());
        return ToActionResult(result);
    }

    [HttpPost("{id:guid}/change-role")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> ChangeRole(Guid id, [FromBody] ChangeRoleRequest request)
    {
        var validationResult = await _changeRoleValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<UserResponse>.Fail(errors));
        }

        var result = await _userService.ChangeRoleAsync(id, request, GetActorUserId());
        return ToActionResult(result);
    }

    // Người thực hiện lấy từ token, không nhận từ client (D44). ActiveUserMiddleware đã kiểm tra
    // claim sub là Guid hợp lệ trước khi vào đây
    private Guid GetActorUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);

    // Dịch kết quả của Service sang status code cho các thao tác trả 200 khi thành công
    private ActionResult<ApiResponse<UserResponse>> ToActionResult(UserResult result)
    {
        return result.Outcome switch
        {
            UserOutcome.Success => Ok(ApiResponse<UserResponse>.Ok(result.User!)),
            UserOutcome.UserNotFound => NotFound(ApiResponse<UserResponse>.Fail("Không tìm thấy tài khoản.")),
            UserOutcome.EmailTaken => Conflict(ApiResponse<UserResponse>.Fail(
                "Email này đã được dùng cho một tài khoản khác.")),
            UserOutcome.SelfDeactivation => Conflict(ApiResponse<UserResponse>.Fail(
                "Bạn không thể vô hiệu hóa chính tài khoản đang đăng nhập.")),
            UserOutcome.LastActiveAdmin => Conflict(ApiResponse<UserResponse>.Fail(
                "Không thể vô hiệu hóa Admin đang hoạt động cuối cùng. Hệ thống phải luôn còn ít nhất một Admin.")),
            UserOutcome.AlreadyInactive => Conflict(ApiResponse<UserResponse>.Fail("Tài khoản này đã bị vô hiệu hóa.")),
            UserOutcome.AlreadyActive => Conflict(ApiResponse<UserResponse>.Fail("Tài khoản này đang hoạt động.")),
            UserOutcome.SelfRoleChange => Conflict(ApiResponse<UserResponse>.Fail(
                "Bạn không thể đổi vai trò của chính tài khoản đang đăng nhập.")),
            UserOutcome.LastActiveAdminDemotion => Conflict(ApiResponse<UserResponse>.Fail(
                "Không thể đổi vai trò của Admin đang hoạt động cuối cùng. Hệ thống phải luôn còn ít nhất một Admin.")),
            UserOutcome.AlreadyHasRole => Conflict(ApiResponse<UserResponse>.Fail("Tài khoản này đã có vai trò này.")),
            _ => throw new InvalidOperationException($"Kết quả thao tác tài khoản không xử lý: {result.Outcome}")
        };
    }
}
