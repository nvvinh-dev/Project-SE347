using NhaTre.Application.DTOs.Classes;

namespace NhaTre.Application.Interfaces;

public interface IClassService
{
    Task<IReadOnlyList<ClassResponse>> GetClassesAsync();
    Task<IReadOnlyList<ClassPlacementResponse>> GetPlacementsAsync();
    Task<ClassPlacementResult> AssignClassAsync(Guid childId, AssignClassRequest request);
    Task<ClassResult> AssignHomeroomTeacherAsync(Guid classId, AssignHomeroomTeacherRequest request);
}
