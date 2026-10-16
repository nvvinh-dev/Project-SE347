using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Pickup;

namespace NhaTre.Application.Interfaces;

public interface IPickupService
{
    Task<PickupResponse?> GetByIdAsync(Guid id, Guid teacherUserId);
    Task<IReadOnlyList<PickupResponse>> GetByDateAsync(DateOnly date, Guid teacherUserId);

    // null khi trẻ ngoài phạm vi lớp chủ nhiệm; danh sách rỗng khi trẻ chưa có người đón
    Task<IReadOnlyList<PickupPersonResponse>?> GetPickupPersonsAsync(Guid childId, Guid teacherUserId);
    Task<PickupResult> CreateAsync(CreatePickupRequest request, Guid teacherUserId);

    // FR-PICKUP-03, phía phụ huynh. null khi trẻ không phải con của tài khoản này; danh sách rỗng khi
    // trẻ chưa có người đón
    Task<IReadOnlyList<PickupPersonResponse>?> GetPickupPersonsForGuardianAsync(Guid childId, Guid parentUserId);

    // null khi trẻ không phải con mình hoặc người đón không thuộc trẻ đó
    Task<PickupPersonResponse?> GetPickupPersonForGuardianAsync(Guid childId, Guid id, Guid parentUserId);
    Task<PickupPersonResult> CreatePickupPersonAsync(Guid childId, CreatePickupPersonRequest request,
        UploadedPhoto facePhoto, Guid parentUserId);

    // facePhoto null nghĩa là giữ ảnh cũ
    Task<PickupPersonResult> UpdatePickupPersonAsync(Guid childId, Guid id, PickupPersonRequest request,
        UploadedPhoto? facePhoto, Guid parentUserId);
    Task<PickupPersonResult> DeletePickupPersonAsync(Guid childId, Guid id, Guid parentUserId);
}
