using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IAttendanceRepository
{
    // Trẻ kèm Class, chỉ khi trẻ thuộc lớp do tài khoản này chủ nhiệm (classes.homeroom_teacher_id, D40 mục 2).
    // null khi trẻ không tồn tại, chưa xếp lớp hoặc thuộc lớp giáo viên khác
    Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId);

    // Bản điểm danh kèm Child, cùng phạm vi lớp chủ nhiệm như trên
    Task<Attendance?> FindByIdInHomeroomClassAsync(Guid id, Guid teacherUserId);

    Task<bool> ExistsAsync(Guid childId, DateOnly attendanceDate);

    // Thêm và lưu ngay; false khi trẻ đã có bản điểm danh ngày đó (vi phạm UNIQUE child_id, attendance_date)
    Task<bool> TryAddAsync(Attendance attendance);
}
