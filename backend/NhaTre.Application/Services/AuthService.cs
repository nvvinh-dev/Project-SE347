using NhaTre.Application.DTOs.Auth;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ISecurityEventService _securityEventService;

    public AuthService(
        IAuthRepository authRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        ISecurityEventService securityEventService)
    {
        _authRepository = authRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _securityEventService = securityEventService;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // D20: login_identifier = email, chuẩn hóa lowercase trước khi so sánh
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _authRepository.FindByLoginIdentifierAsync(normalizedEmail);

        if (user is null)
        {
            await RecordLoginFailedAsync(normalizedEmail, targetUserId: null);
            return null;
        }

        if (!_passwordHasher.Verify(user.CredentialReference, request.Password))
        {
            await RecordLoginFailedAsync(normalizedEmail, user.Id);
            return null;
        }

        // D20: chặn ngay tại lúc login nếu tài khoản đã bị khóa
        if (!user.IsActive)
        {
            await RecordLoginFailedAsync(normalizedEmail, user.Id);
            return null;
        }

        var roleClaim = Roles.FromRoleId(user.RoleId);
        var tokenResult = _tokenService.GenerateToken(user.Id, roleClaim);

        await _securityEventService.RecordAsync(
            SecurityEventTypes.LoginSucceeded,
            actorUserId: user.Id,
            targetUserId: user.Id);

        return new LoginResponse(
            tokenResult.Token,
            tokenResult.ExpiresAtUtc,
            user.Id,
            user.FullName,
            roleClaim);
    }

    // D20: JWT không chứa PII nên họ tên phải đọc lại từ DB, không lấy từ claim
    public async Task<CurrentUserResponse?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _authRepository.FindByIdAsync(userId);

        if (user is null)
            return null;

        return new CurrentUserResponse(
            user.Id,
            user.FullName,
            Roles.FromRoleId(user.RoleId));
    }

    // D50: chưa xác định được ai đăng nhập nên actor rỗng; target là tài khoản mang email đó
    // nếu có, để tra được các lần đoán mật khẩu nhắm vào một tài khoản
    private Task RecordLoginFailedAsync(string normalizedEmail, Guid? targetUserId)
    {
        return _securityEventService.RecordAsync(
            SecurityEventTypes.LoginFailed,
            actorUserId: null,
            targetUserId: targetUserId,
            targetReference: normalizedEmail);
    }
}