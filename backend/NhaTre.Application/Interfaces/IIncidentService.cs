using NhaTre.Application.DTOs.Incidents;

namespace NhaTre.Application.Interfaces;

public interface IIncidentService
{
    // null khi trẻ ngoài phạm vi lớp chủ nhiệm của giáo viên → 404
    Task<IncidentResponse?> CreateIncidentAsync(CreateIncidentRequest request, Guid teacherUserId);

    Task<IncidentResponse?> GetIncidentByIdAsync(Guid id, Guid teacherUserId);
}
