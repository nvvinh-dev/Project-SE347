using NhaTre.Application.DTOs.Teachers;

namespace NhaTre.Application.Interfaces;

public interface ITeacherService
{
    Task<IReadOnlyList<TeacherResponse>> GetAllAsync();
    Task<TeacherResponse?> GetByIdAsync(Guid id);
    Task<IReadOnlyList<TeacherAccountResponse>> GetAccountsWithoutProfileAsync();
    Task<TeacherResult> CreateAsync(CreateTeacherRequest request);
}
