using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IAttendanceRepository
{
    // Trẻ, chỉ khi trẻ thuộc lớp tài khoản này phụ trách (GVCN hoặc giáo viên phụ, D40 mục 2).
    // null khi trẻ không tồn tại, chưa xếp lớp hoặc thuộc lớp giáo viên khác
    Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId);

    // Bản điểm danh kèm Child, cùng phạm vi lớp phụ trách như trên
    Task<Attendance?> FindByIdInHomeroomClassAsync(Guid id, Guid teacherUserId);

    // true khi lớp tồn tại và do tài khoản này phụ trách
    Task<bool> IsHomeroomClassAsync(Guid classId, Guid teacherUserId);

    // Các bản điểm danh kèm Child của trẻ đang thuộc lớp tài khoản này phụ trách, lọc thêm theo
    // trẻ, lớp, ngày khi có giá trị. Ngày mới nhất trước, cùng ngày thì theo họ tên trẻ
    Task<IReadOnlyList<Attendance>> GetInHomeroomClassesAsync(
        Guid teacherUserId, Guid? childId, Guid? classId, DateOnly? date);

    // true khi trẻ có liên kết với tài khoản phụ huynh này trong child_guardians (D39 mục 10)
    Task<bool> IsGuardianOfChildAsync(Guid childId, Guid parentUserId);

    // Các bản điểm danh của trẻ, chỉ khi trẻ có liên kết với tài khoản phụ huynh này. Ngày mới nhất trước
    Task<IReadOnlyList<Attendance>> GetByChildForGuardianAsync(Guid childId, Guid parentUserId);

    Task<bool> ExistsAsync(Guid childId, DateOnly attendanceDate);

    // Thêm và lưu ngay; false khi trẻ đã có bản điểm danh ngày đó (vi phạm UNIQUE child_id, attendance_date)
    Task<bool> TryAddAsync(Attendance attendance);

    // Hồ sơ teachers của tài khoản này, để ghi người ghi nhận là chính giáo viên đã thao tác (D44 mục 2).
    // null khi tài khoản không có hồ sơ
    Task<Guid?> FindTeacherIdAsync(Guid teacherUserId);
}
