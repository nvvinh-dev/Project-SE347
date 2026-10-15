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

    // Bản ghi đón về gắn với bản điểm danh của ngày đó, kèm Attendance và Child, cùng phạm vi lớp chủ nhiệm
    Task<IReadOnlyList<Pickup>> GetByDateInHomeroomClassesAsync(DateOnly attendanceDate, Guid teacherUserId);

    // Thêm và lưu ngay; false khi bản điểm danh đã có bản ghi đón về (vi phạm UNIQUE attendance_id)
    Task<bool> TryAddAsync(Pickup pickup);

    // FR-PICKUP-03: trẻ có dòng child_guardians với tài khoản phụ huynh này (BR-SCOPE-01, D40 mục 2)
    Task<bool> IsGuardianOfChildAsync(Guid childId, Guid parentUserId);

    // Thêm và lưu ngay; false khi trẻ đã có người đón cùng thứ tự ưu tiên (vi phạm UNIQUE (child_id, priority))
    Task<bool> TryAddRegisteredPersonAsync(RegisteredPickupPerson person);

    // Ghi đè 4 thông tin, khóa ảnh và hai cột xác nhận đồng ý của người đón person.Id, chỉ khi khóa ảnh
    // đang lưu vẫn là currentFacePhotoReference. false khi người đón đã bị xóa hoặc vừa bị request
    // khác sửa (khóa ảnh đã đổi)
    Task<bool> TryUpdateRegisteredPersonAsync(RegisteredPickupPerson person, string currentFacePhotoReference);

    // Xóa người đón dự phòng id, cùng điều kiện khóa ảnh như trên. Người đón chính không bao giờ bị xóa
    // ở đây (D40 mục 1); false khi không còn dòng nào khớp
    Task<bool> TryDeleteBackupPersonAsync(Guid id, string currentFacePhotoReference);
}
