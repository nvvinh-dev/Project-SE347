using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface ITuitionRepository
{
    Task<IReadOnlyList<TuitionFee>> GetAllFeesAsync();
    Task<TuitionFee?> FindFeeByIdAsync(Guid id);
    Task<bool> AnyFeeAsync();
    void AddFee(TuitionFee fee);
    Task SaveChangesAsync();
}
