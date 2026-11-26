using NhaTre.Application.DTOs.Classes;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

// Mọi method ghi tự lưu ngay, không qua SaveChanges của Service
public interface IClassRepository
{
    Task<IReadOnlyList<GradeLevelResponse>> GetGradeLevelsAsync();
    Task<bool> GradeLevelExistsAsync(short gradeLevelId);

    // Chỉ lớp đang hoạt động (BR-CLASS-05)
    Task<IReadOnlyList<ClassResponse>> GetAllAsync();

    // Đọc cả lớp đã lưu trữ: dùng để trả về lớp vừa ghi
    Task<ClassResponse?> GetResponseByIdAsync(Guid id);

    // Kèm khối của lớp; đọc cả lớp đã lưu trữ để Service trả 409 thay vì 404
    Task<Class?> FindByIdAsync(Guid id);

    // So đúng chuỗi như unique index của classes.name, kể cả lớp đã lưu trữ; exceptClassId là lớp đang sửa
    Task<bool> NameExistsAsync(string name, Guid? exceptClassId);

    // false khi unique index chặn: request khác vừa dùng tên này giữa lúc Service kiểm tra và lúc ghi
    Task<bool> AddAsync(Class newClass);

    // Khóa dòng lớp rồi mới xét lưu trữ, số trẻ: ClassNotFound, ClassArchived, ChangeGradeWithChildren,
    // MaxCapacityBelowChildCount, DuplicateClassName (unique index chặn) hoặc Success
    Task<ClassOutcome> UpdateAsync(Guid classId, short gradeLevelId, string name, int? minCapacity, int? maxCapacity);

    // Khóa dòng lớp rồi mới xét: ClassNotFound, ClassArchived, ArchiveWithChildren hoặc Success. Thành công thì
    // gỡ giáo viên chủ nhiệm, mọi giáo viên phụ và đặt archived_at_utc trong cùng transaction
    Task<ClassOutcome> ArchiveAsync(Guid classId, DateTime archivedAtUtc);

    // Đọc thẳng ra DTO xếp lớp: chỉ lấy đúng các cột Admin được xem (D45)
    Task<IReadOnlyList<ClassPlacementResponse>> GetPlacementsAsync();
    Task<ClassPlacementResponse?> FindPlacementAsync(Guid childId);

    // Khóa dòng lớp đích rồi mới xếp: ClassArchived khi lớp vừa bị lưu trữ, ClassChanged khi khối của lớp
    // không còn là expectedGradeLevelId, ChildChanged khi ngày sinh của trẻ không còn là expectedDateOfBirth
    Task<ClassOutcome> AssignClassAsync(
        Guid childId, Guid classId, short expectedGradeLevelId, DateOnly expectedDateOfBirth);

    // false khi trẻ đã không còn lớp lúc UPDATE chạy
    Task<bool> RemoveFromClassAsync(Guid childId);

    Task<User?> FindUserWithTeacherProfileAsync(Guid userId);

    // Id hồ sơ teachers của những tài khoản trong userIds là Giáo viên đang hoạt động có hồ sơ;
    // tài khoản không đạt thì không có mặt trong kết quả
    Task<IReadOnlyList<Guid>> FindActiveTeacherProfileIdsAsync(IReadOnlyCollection<Guid> userIds);

    // Khóa dòng lớp rồi mới xét, nên không đan xen với lần gán giáo viên phụ hay lần lưu trữ đang chạy:
    // ClassArchived khi lớp đã lưu trữ, HomeroomIsAssistant khi teacherId đang là giáo viên phụ của lớp
    Task<ClassOutcome> SetHomeroomTeacherAsync(Guid classId, Guid? teacherId);

    // Thay toàn bộ giáo viên phụ của lớp bằng teacherIds (id hồ sơ teachers). Khóa dòng lớp rồi mới
    // xét: ClassNotFound khi lớp không còn, ClassArchived khi lớp đã lưu trữ, AssistantIsHomeroom khi
    // danh sách có giáo viên chủ nhiệm
    Task<ClassOutcome> ReplaceAssistantTeachersAsync(Guid classId, IReadOnlyCollection<Guid> teacherIds);
}
