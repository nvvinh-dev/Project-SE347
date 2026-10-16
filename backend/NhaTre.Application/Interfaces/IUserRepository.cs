using NhaTre.Application.DTOs.Users;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

// Mọi method ghi tự lưu ngay: phần lớn là một câu UPDATE có điều kiện, nên tạo mới cũng lưu luôn
// để cả repository một kiểu
public interface IUserRepository
{
    Task<IReadOnlyList<User>> GetAllAsync();
    Task<User?> FindByIdAsync(Guid id);
    Task<bool> IsEmailTakenAsync(string normalizedEmail, Guid? exceptUserId = null);

    // false khi unique index của email chặn (request khác vừa dùng email này)
    Task<bool> AddAsync(User user);
    Task<bool> UpdateProfileAsync(Guid id, string fullName, string normalizedEmail);

    // Hai method này khóa các Admin đang hoạt động rồi mới xét quy tắc và ghi, trong cùng một transaction
    // (D39 mục 7)
    Task<UserOutcome> DeactivateAsync(Guid id);
    Task<UserOutcome> ChangeRoleAsync(Guid id, short newRoleId);

    // false khi tài khoản đã hoạt động lúc UPDATE chạy
    Task<bool> ActivateAsync(Guid id);
    Task ResetPasswordAsync(Guid id, string passwordHash);
}
