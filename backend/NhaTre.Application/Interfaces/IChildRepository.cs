using NhaTre.Application.DTOs.Children;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IChildRepository
{
    Task<IReadOnlyList<Child>> GetAllAsync();
    Task<IReadOnlyList<MyChildResponse>> GetByGuardianAsync(Guid guardianUserId);
    Task<Child?> FindByIdAsync(Guid id);
    void Add(Child child);
    Task SaveChangesAsync();
}
