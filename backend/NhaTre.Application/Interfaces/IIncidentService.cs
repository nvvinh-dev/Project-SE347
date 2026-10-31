using NhaTre.Application.DTOs.Incidents;

namespace NhaTre.Application.Interfaces;

public interface IIncidentService
{
    // null khi trẻ ngoài phạm vi lớp chủ nhiệm của giáo viên → 404
    Task<IncidentResponse?> CreateIncidentAsync(CreateIncidentRequest request, Guid teacherUserId);

    // Giáo viên: null khi sự cố không tồn tại hoặc ngoài phạm vi lớp chủ nhiệm → 404
    Task<IncidentResponse?> GetIncidentByIdAsync(Guid id, Guid teacherUserId);

    // Y tế: sự cố của mọi trẻ trong trường (D39 mục 9). null chỉ khi sự cố không tồn tại → 404
    Task<IncidentResponse?> GetIncidentForMedicalAsync(Guid id);

    // Trả sự cố kèm mọi ảnh đã đính. null khi sự cố không tồn tại hoặc ngoài phạm vi lớp chủ nhiệm → 404
    Task<IncidentResponse?> AttachPhotosAsync(Guid incidentId, AttachIncidentPhotosRequest request, Guid teacherUserId);
}
