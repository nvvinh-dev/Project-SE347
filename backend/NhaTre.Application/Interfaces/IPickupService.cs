using NhaTre.Application.DTOs.Pickup;

namespace NhaTre.Application.Interfaces;

public interface IPickupService
{
    Task<PickupResponse?> GetByIdAsync(Guid id, Guid teacherUserId);
    Task<IReadOnlyList<PickupResponse>> GetByDateAsync(DateOnly date, Guid teacherUserId);

    // null khi trẻ ngoài phạm vi lớp chủ nhiệm; danh sách rỗng khi trẻ chưa có người đón
    Task<IReadOnlyList<PickupPersonResponse>?> GetPickupPersonsAsync(Guid childId, Guid teacherUserId);
    Task<PickupResult> CreateAsync(CreatePickupRequest request, Guid teacherUserId);
}
