using NhaTre.Application.DTOs.Tuition;

namespace NhaTre.Application.Interfaces;

public interface ITuitionService
{
    Task<IReadOnlyList<TuitionFeeResponse>> GetFeesAsync();
    Task<TuitionFeeResponse?> GetFeeByIdAsync(Guid id);
    Task<TuitionFeeResponse?> CreateFeeAsync(TuitionFeeRequest request);
    Task<TuitionFeeResponse?> UpdateFeeAsync(Guid id, TuitionFeeRequest request);
}
