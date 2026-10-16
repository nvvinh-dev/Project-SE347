using NhaTre.Application.DTOs.Users;

namespace NhaTre.Application.Interfaces;

public interface IUserService
{
    Task<IReadOnlyList<UserResponse>> GetUsersAsync();
    Task<UserResponse?> GetUserByIdAsync(Guid id);
    Task<UserResult> CreateUserAsync(CreateUserRequest request);
    Task<UserResult> UpdateUserAsync(Guid id, UpdateUserRequest request);
    Task<UserResult> DeactivateUserAsync(Guid id, Guid actorUserId);
    Task<UserResult> ActivateUserAsync(Guid id, Guid actorUserId);
    Task<UserResult> ResetPasswordAsync(Guid id, ResetPasswordRequest request, Guid actorUserId);
    Task<UserResult> ChangeRoleAsync(Guid id, ChangeRoleRequest request, Guid actorUserId);
}
