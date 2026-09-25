using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface IChildRepository
{
    Task<IReadOnlyList<Child>> GetAllAsync();
    Task<Child?> FindByIdAsync(Guid id);
    Task AddAsync(Child child);
    Task SaveChangesAsync();
}
