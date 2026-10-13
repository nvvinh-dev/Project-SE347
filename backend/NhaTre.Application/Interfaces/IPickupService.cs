using NhaTre.Application.DTOs.Pickup;

namespace NhaTre.Application.Interfaces;

public interface IPickupService
{
    Task<PickupResponse?> GetByIdAsync(Guid id, Guid teacherUserId);
    Task<PickupResult> CreateAsync(CreatePickupRequest request, Guid teacherUserId);
}
