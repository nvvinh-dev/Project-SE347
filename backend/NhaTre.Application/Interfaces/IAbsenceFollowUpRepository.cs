using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IAbsenceFollowUpRepository
{
    // Bản điểm danh kèm Child và Class, chỉ khi trẻ đang thuộc lớp tài khoản này phụ trách (GVCN hoặc
    // giáo viên phụ, D40 mục 2). null khi không tồn tại hoặc ngoài phạm vi
    Task<Attendance?> FindAttendanceInScopeAsync(Guid attendanceId, Guid teacherUserId);

    // Bản điểm danh AbsentUnexcused của ngày đó, kèm Child, Class, người đón đã đăng ký và các lần liên
    // hệ (kèm giáo viên đã ghi), của trẻ đang thuộc lớp tài khoản này phụ trách
    Task<IReadOnlyList<Attendance>> GetUnexcusedInScopeAsync(DateOnly date, Guid teacherUserId);

    // Như trên nhưng của mọi lớp, cho danh sách cần xử lý của Admin; không kèm người đón
    Task<IReadOnlyList<Attendance>> GetUnexcusedAsync(DateOnly date);

    // Các lần liên hệ của các bản điểm danh này, kèm họ tên giáo viên đã ghi, cũ trước
    Task<IReadOnlyList<AbsenceFollowUp>> GetFollowUpsAsync(IReadOnlyCollection<Guid> attendanceIds);

    Task<Guid?> FindTeacherIdAsync(Guid teacherUserId);

    Task<string?> FindUserFullNameAsync(Guid userId);

    // Thêm và lưu ngay
    Task AddAsync(AbsenceFollowUp followUp);
}
