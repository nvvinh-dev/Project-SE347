using NhaTre.Application.DTOs.Classes;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

// Mọi method ghi là một câu UPDATE tự lưu ngay, không qua SaveChanges
public interface IClassRepository
{
    Task<IReadOnlyList<ClassResponse>> GetAllAsync();
    Task<Class?> FindByIdAsync(Guid id);

    // Đọc thẳng ra DTO xếp lớp: chỉ lấy đúng các cột Admin được xem (D45)
    Task<IReadOnlyList<ClassPlacementResponse>> GetPlacementsAsync();
    Task<ClassPlacementResponse?> FindPlacementAsync(Guid childId);

    // false khi ngày sinh của trẻ không còn là expectedDateOfBirth lúc UPDATE chạy
    Task<bool> AssignClassAsync(Guid childId, Guid classId, DateOnly expectedDateOfBirth);

    // false khi trẻ đã không còn lớp lúc UPDATE chạy
    Task<bool> RemoveFromClassAsync(Guid childId);

    Task<User?> FindUserWithTeacherProfileAsync(Guid userId);
    Task SetHomeroomTeacherAsync(Guid classId, Guid? teacherId);
}
