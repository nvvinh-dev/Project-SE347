using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IIncidentRepository
{
    // Trẻ kèm Class, chỉ khi trẻ thuộc lớp do tài khoản này chủ nhiệm (classes.homeroom_teacher_id, D40 mục 2).
    // null khi trẻ không tồn tại, chưa xếp lớp hoặc thuộc lớp giáo viên khác
    Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId);

    // Sự cố kèm Child và IncidentPhotos, cùng phạm vi lớp chủ nhiệm như trên
    Task<Incident?> FindIncidentInHomeroomClassAsync(Guid id, Guid teacherUserId);

    // Sự cố kèm Child và IncidentPhotos, không lọc lớp: Y tế xem sự cố của mọi trẻ trong trường (D39 mục 9).
    // null khi sự cố không tồn tại
    Task<Incident?> FindIncidentAsync(Guid id);

    void AddIncident(Incident incident);

    void AddIncidentPhotos(IEnumerable<IncidentPhoto> photos);

    Task SaveChangesAsync();
}
