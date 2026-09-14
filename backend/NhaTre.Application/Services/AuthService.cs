using NhaTre.Application.DTOs.Auth;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public AuthService(
        IAuthRepository authRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _authRepository = authRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // D20: login_identifier = email, chuẩn hóa lowercase trước khi so sánh
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _authRepository.FindByLoginIdentifierAsync(normalizedEmail);

        if (user is null)
            return null;

        if (!_passwordHasher.Verify(user.CredentialReference, request.Password))
            return null;

        // D20 / audit Opus mục 3.1: chặn ngay tại lúc login nếu tài khoản đã bị khóa
        if (!user.IsActive)
            return null;

        var roleClaim = Roles.FromRoleId(user.RoleId);
        var tokenResult = _tokenService.GenerateToken(user.Id, roleClaim);

        return new LoginResponse(
            tokenResult.Token,
            tokenResult.ExpiresAtUtc,
            user.Id,
            user.FullName,
            roleClaim);
    }
}