using NhaTre.Application.DTOs.Teachers;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

// Các method đọc trả thẳng DTO: chỉ lấy đúng các cột Kế toán được xem (D45)
public interface ITeacherRepository
{
    // Mọi hồ sơ, kể cả hồ sơ của tài khoản đã bị vô hiệu hóa hoặc đã đổi vai trò
    Task<IReadOnlyList<TeacherResponse>> GetAllAsync();

    Task<TeacherResponse?> FindByIdAsync(Guid id);

    // Tài khoản vai trò Giáo viên đang hoạt động chưa có hồ sơ
    Task<IReadOnlyList<TeacherAccountResponse>> GetAccountsWithoutProfileAsync();

    // null khi không có tài khoản vai trò Giáo viên đang hoạt động mang id này
    Task<TeacherAccountResponse?> FindActiveTeacherAccountAsync(Guid userId);

    Task<bool> ProfileExistsAsync(Guid userId);

    // false khi tài khoản đã có hồ sơ lúc INSERT chạy: request khác vừa tạo trước
    Task<bool> AddAsync(Teacher teacher);
}
