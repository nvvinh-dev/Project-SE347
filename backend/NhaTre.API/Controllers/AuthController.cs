using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Auth;
using NhaTre.Application.Interfaces;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<LoginRequest> _loginValidator;

    public AuthController(IAuthService authService, IValidator<LoginRequest> loginValidator)
    {
        _authService = authService;
        _loginValidator = loginValidator;
    }

    [HttpPost("login")]
    [EnableRateLimiting("LoginPolicy")] // D20: 5 lần thử / 1 phút / 1 IP — cấu hình ở Program.cs
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var validationResult = await _loginValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<LoginResponse>.Fail(errors));
        }

        var result = await _authService.LoginAsync(request);

        if (result is null)
            return Unauthorized(ApiResponse<LoginResponse>.Fail("Email hoặc mật khẩu không đúng."));

        return Ok(ApiResponse<LoginResponse>.Ok(result));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<CurrentUserResponse>>> Me()
    {
        // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
        var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);

        var result = await _authService.GetCurrentUserAsync(userId);

        if (result is null)
            return NotFound(ApiResponse<CurrentUserResponse>.Fail("Không tìm thấy tài khoản."));

        return Ok(ApiResponse<CurrentUserResponse>.Ok(result));
    }
}