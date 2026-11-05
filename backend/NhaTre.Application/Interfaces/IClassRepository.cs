using NhaTre.Application.DTOs.Classes;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

// Mọi method ghi tự lưu ngay, không qua SaveChanges của Service
public interface IClassRepository
{
    Task<IReadOnlyList<ClassResponse>> GetAllAsync();
    Task<ClassResponse?> GetResponseByIdAsync(Guid id);
    Task<Class?> FindByIdAsync(Guid id);

    // Đọc thẳng ra DTO xếp lớp: chỉ lấy đúng các cột Admin được xem (D45)
    Task<IReadOnlyList<ClassPlacementResponse>> GetPlacementsAsync();
    Task<ClassPlacementResponse?> FindPlacementAsync(Guid childId);

    // false khi ngày sinh của trẻ không còn là expectedDateOfBirth lúc UPDATE chạy
    Task<bool> AssignClassAsync(Guid childId, Guid classId, DateOnly expectedDateOfBirth);

    // false khi trẻ đã không còn lớp lúc UPDATE chạy
    Task<bool> RemoveFromClassAsync(Guid childId);

    Task<User?> FindUserWithTeacherProfileAsync(Guid userId);

    // Id hồ sơ teachers của những tài khoản trong userIds là Giáo viên đang hoạt động có hồ sơ;
    // tài khoản không đạt thì không có mặt trong kết quả
    Task<IReadOnlyList<Guid>> FindActiveTeacherProfileIdsAsync(IReadOnlyCollection<Guid> userIds);

    // Khóa dòng lớp rồi mới xét, nên không đan xen với lần gán giáo viên phụ đang chạy:
    // HomeroomIsAssistant khi teacherId đang là giáo viên phụ của lớp
    Task<ClassOutcome> SetHomeroomTeacherAsync(Guid classId, Guid? teacherId);

    // Thay toàn bộ giáo viên phụ của lớp bằng teacherIds (id hồ sơ teachers). Khóa dòng lớp rồi mới
    // xét: ClassNotFound khi lớp không còn, AssistantIsHomeroom khi danh sách có giáo viên chủ nhiệm
    Task<ClassOutcome> ReplaceAssistantTeachersAsync(Guid classId, IReadOnlyCollection<Guid> teacherIds);
}
