using NhaTre.Application.DTOs.Incidents;

namespace NhaTre.Application.Interfaces;

public interface IIncidentService
{
    // null khi trẻ ngoài phạm vi lớp chủ nhiệm của giáo viên → 404
    Task<IncidentResponse?> CreateIncidentAsync(CreateIncidentRequest request, Guid teacherUserId);

    Task<IncidentResponse?> GetIncidentByIdAsync(Guid id, Guid teacherUserId);

    // Trả sự cố kèm mọi ảnh đã đính. null khi sự cố không tồn tại hoặc ngoài phạm vi lớp chủ nhiệm → 404
    Task<IncidentResponse?> AttachPhotosAsync(Guid incidentId, AttachIncidentPhotosRequest request, Guid teacherUserId);

    // Phụ huynh: null khi trẻ không tồn tại hoặc không liên kết với mình → 404; con mình chưa có sự cố → rỗng
    Task<IReadOnlyList<ChildIncidentSummaryResponse>?> GetChildIncidentsForGuardianAsync(Guid childId,
        Guid parentUserId);

    // Phụ huynh: null khi sự cố không tồn tại, thuộc trẻ khác hoặc trẻ không liên kết với mình → 404
    Task<ChildIncidentResponse?> GetChildIncidentForGuardianAsync(Guid childId, Guid incidentId, Guid parentUserId);
}
