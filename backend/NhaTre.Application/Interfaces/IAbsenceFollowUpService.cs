using NhaTre.Application.DTOs.AbsenceFollowUps;

namespace NhaTre.Application.Interfaces;

public interface IAbsenceFollowUpService
{
    Task<IReadOnlyList<AbsenceTodayResponse>> GetTodayForTeacherAsync(Guid teacherUserId);
    Task<AbsenceFollowUpResult> CreateAsync(Guid attendanceId, CreateAbsenceFollowUpRequest request, Guid teacherUserId);
    Task<IReadOnlyList<AbsenceEscalationResponse>> GetTodayEscalationsAsync();
}
