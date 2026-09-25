using NhaTre.Application.DTOs.Children;

namespace NhaTre.Application.Interfaces;

public interface IChildService
{
    Task<IReadOnlyList<ChildResponse>> GetAllAsync();
    Task<ChildResponse?> GetByIdAsync(Guid id);
    Task<ChildResponse> CreateAsync(ChildProfileRequest request);
    Task<ChildResponse?> UpdateAsync(Guid id, ChildProfileRequest request);
}
