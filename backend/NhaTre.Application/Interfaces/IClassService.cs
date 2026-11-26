using NhaTre.Application.DTOs.Classes;

namespace NhaTre.Application.Interfaces;

public interface IClassService
{
    Task<IReadOnlyList<GradeLevelResponse>> GetGradeLevelsAsync();
    Task<IReadOnlyList<ClassResponse>> GetClassesAsync();
    Task<ClassResult> CreateClassAsync(SaveClassRequest request);
    Task<ClassResult> UpdateClassAsync(Guid classId, SaveClassRequest request);
    Task<ClassResult> ArchiveClassAsync(Guid classId);
    Task<IReadOnlyList<ClassPlacementResponse>> GetPlacementsAsync();
    Task<ClassPlacementResult> AssignClassAsync(Guid childId, AssignClassRequest request);
    Task<ClassResult> AssignHomeroomTeacherAsync(Guid classId, AssignHomeroomTeacherRequest request);
    Task<ClassResult> AssignAssistantTeachersAsync(Guid classId, AssignAssistantTeachersRequest request);
}
