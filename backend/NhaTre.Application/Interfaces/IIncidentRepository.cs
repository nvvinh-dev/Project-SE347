using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IIncidentRepository
{
    // Trẻ, chỉ khi trẻ thuộc lớp tài khoản này phụ trách (GVCN hoặc giáo viên phụ, D40 mục 2).
    // null khi trẻ không tồn tại, chưa xếp lớp hoặc thuộc lớp giáo viên khác
    Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId);

    // Sự cố kèm Child và IncidentPhotos, cùng phạm vi lớp phụ trách như trên
    Task<Incident?> FindIncidentInHomeroomClassAsync(Guid id, Guid teacherUserId);

    // Sự cố kèm Child và IncidentPhotos, không lọc lớp: Y tế xem sự cố của mọi trẻ trong trường (D39 mục 9).
    // null khi sự cố không tồn tại
    Task<Incident?> FindIncidentAsync(Guid id);

    void AddIncident(Incident incident);

    void AddIncidentPhotos(IEnumerable<IncidentPhoto> photos);

    Task SaveChangesAsync();

    // FR-INCIDENT-03, phía phụ huynh: phạm vi là trẻ có liên kết với tài khoản này trong child_guardians
    // (BR-SCOPE-01), không phụ thuộc lớp. Sự cố kèm IncidentPhotos, chỉ để đếm số ảnh; mới nhất trước. Rỗng
    // khi trẻ chưa có sự cố hoặc không liên kết với tài khoản này
    Task<IReadOnlyList<Incident>> GetIncidentsOfChildForGuardianAsync(Guid childId, Guid parentUserId);

    // Sự cố kèm IncidentPhotos, cùng phạm vi như trên. null khi sự cố không tồn tại, không thuộc trẻ này hoặc
    // trẻ không liên kết với tài khoản này
    Task<Incident?> FindIncidentOfChildForGuardianAsync(Guid childId, Guid incidentId, Guid parentUserId);

    // Hồ sơ teachers của tài khoản này, để ghi người ghi nhận là chính giáo viên đã thao tác (D44 mục 2).
    // null khi tài khoản không có hồ sơ
    Task<Guid?> FindTeacherIdAsync(Guid teacherUserId);
}
