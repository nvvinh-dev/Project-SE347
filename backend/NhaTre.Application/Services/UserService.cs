using NhaTre.Application.DTOs.Users;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<IReadOnlyList<UserResponse>> GetUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(ToResponse).ToList();
    }

    public async Task<UserResponse?> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.FindByIdAsync(id);
        return user is null ? null : ToResponse(user);
    }

    public async Task<UserResult> CreateUserAsync(CreateUserRequest request)
    {
        var email = NormalizeEmail(request.Email);

        if (await _userRepository.IsEmailTakenAsync(email))
            return new UserResult(UserOutcome.EmailTaken);

        // D20: hash ngay khi nhận, không lưu mật khẩu thô
        var user = new User
        {
            Id = Guid.NewGuid(),
            RoleId = Roles.ToRoleId(request.Role),
            FullName = request.FullName.Trim(),
            LoginIdentifier = email,
            CredentialReference = _passwordHasher.Hash(request.Password),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        if (!await _userRepository.AddAsync(user))
            return new UserResult(UserOutcome.EmailTaken);

        return new UserResult(UserOutcome.Success, ToResponse(user));
    }

    public async Task<UserResult> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _userRepository.FindByIdAsync(id);

        if (user is null)
            return new UserResult(UserOutcome.UserNotFound);

        var fullName = request.FullName.Trim();
        var email = NormalizeEmail(request.Email);

        if (await _userRepository.IsEmailTakenAsync(email, exceptUserId: id))
            return new UserResult(UserOutcome.EmailTaken);

        if (!await _userRepository.UpdateProfileAsync(id, fullName, email))
            return new UserResult(UserOutcome.EmailTaken);

        return new UserResult(UserOutcome.Success, ToResponse(user) with { FullName = fullName, Email = email });
    }

    public async Task<UserResult> DeactivateUserAsync(Guid id, Guid actorUserId)
    {
        // BR-USER-05: Admin không vô hiệu hóa chính mình. Không phụ thuộc dữ liệu nên xét trước khi đọc DB
        if (id == actorUserId)
            return new UserResult(UserOutcome.SelfDeactivation);

        var user = await _userRepository.FindByIdAsync(id);

        if (user is null)
            return new UserResult(UserOutcome.UserNotFound);

        // Đã vô hiệu hóa hay là Admin đang hoạt động cuối cùng do repository xét khi đã khóa các Admin,
        // không xét trên bản vừa đọc ở trên
        var outcome = await _userRepository.DeactivateAsync(id);

        if (outcome != UserOutcome.Success)
            return new UserResult(outcome);

        return new UserResult(UserOutcome.Success, ToResponse(user) with { IsActive = false });
    }

    public async Task<UserResult> ActivateUserAsync(Guid id)
    {
        var user = await _userRepository.FindByIdAsync(id);

        if (user is null)
            return new UserResult(UserOutcome.UserNotFound);

        if (user.IsActive)
            return new UserResult(UserOutcome.AlreadyActive);

        // UPDATE chỉ khớp khi tài khoản còn bị vô hiệu hóa: request khác mở lại trước thì không dòng nào khớp
        if (!await _userRepository.ActivateAsync(id))
            return new UserResult(UserOutcome.AlreadyActive);

        return new UserResult(UserOutcome.Success, ToResponse(user) with { IsActive = true });
    }

    // Đặt lại được cả tài khoản đang bị vô hiệu hóa; trạng thái giữ nguyên
    public async Task<UserResult> ResetPasswordAsync(Guid id, ResetPasswordRequest request)
    {
        var user = await _userRepository.FindByIdAsync(id);

        if (user is null)
            return new UserResult(UserOutcome.UserNotFound);

        await _userRepository.ResetPasswordAsync(id, _passwordHasher.Hash(request.NewPassword));

        return new UserResult(UserOutcome.Success, ToResponse(user));
    }

    // D20: email là login_identifier, chuẩn hóa trước khi lưu và trước khi so trùng
    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static UserResponse ToResponse(User user)
        => new(user.Id, user.FullName, user.LoginIdentifier, Roles.FromRoleId(user.RoleId), user.IsActive);
}
