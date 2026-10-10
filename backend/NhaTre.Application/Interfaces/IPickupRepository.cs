using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IPickupRepository
{
    // Trẻ kèm Class, chỉ khi trẻ thuộc lớp do tài khoản này chủ nhiệm (classes.homeroom_teacher_id, D40 mục 2).
    // null khi trẻ không tồn tại, chưa xếp lớp hoặc thuộc lớp giáo viên khác
    Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId);

    // Bản điểm danh của trẻ trong ngày đó kèm Pickup (nếu đã đón); null khi trẻ chưa được điểm danh
    Task<Attendance?> FindAttendanceAsync(Guid childId, DateOnly attendanceDate);

    // Người đón đã đăng ký của đúng trẻ này, người đón chính trước (tối đa hai người, D24)
    Task<IReadOnlyList<RegisteredPickupPerson>> GetRegisteredPersonsAsync(Guid childId);

    // Bản ghi đón về kèm Attendance và Child, cùng phạm vi lớp chủ nhiệm như trên
    Task<Pickup?> FindByIdInHomeroomClassAsync(Guid id, Guid teacherUserId);

    // Thêm và lưu ngay; false khi bản điểm danh đã có bản ghi đón về (vi phạm UNIQUE attendance_id)
    Task<bool> TryAddAsync(Pickup pickup);
}
