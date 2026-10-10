using NhaTre.Application.DTOs.Children;

namespace NhaTre.Application.Interfaces;

// Các method đọc tài khoản trả thẳng DTO: chỉ lấy đúng các cột Kế toán được xem (D45)
public interface IChildGuardianRepository
{
    // Tài khoản vai trò Phụ huynh đang hoạt động. search là chữ thường, null thì lấy tất cả
    Task<IReadOnlyList<GuardianResponse>> SearchActiveParentsAsync(string? search);

    // null khi không có tài khoản vai trò Phụ huynh đang hoạt động mang id này
    Task<GuardianResponse?> FindActiveParentAsync(Guid userId);

    Task<bool> ChildExistsAsync(Guid childId);

    // Mọi liên kết của trẻ, kể cả tài khoản đã bị vô hiệu hóa hoặc đã đổi vai trò
    Task<IReadOnlyList<GuardianResponse>> GetGuardiansOfChildAsync(Guid childId);

    Task<GuardianResponse?> FindGuardianOfChildAsync(Guid childId, Guid guardianUserId);

    Task<bool> LinkExistsAsync(Guid childId, Guid guardianUserId);

    // false khi liên kết đã có lúc INSERT chạy: request khác vừa tạo trước
    Task<bool> AddLinkAsync(Guid childId, Guid guardianUserId);

    // false khi liên kết đã không còn lúc DELETE chạy: request khác vừa gỡ trước
    Task<bool> RemoveLinkAsync(Guid childId, Guid guardianUserId);
}
