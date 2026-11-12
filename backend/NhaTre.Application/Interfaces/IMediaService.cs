using NhaTre.Application.DTOs.Media;

namespace NhaTre.Application.Interfaces;

public interface IMediaService
{
    // Các lớp tài khoản này phụ trách, để màn hình chia sẻ ảnh chọn lớp; chưa phụ trách lớp nào thì danh sách rỗng
    Task<IReadOnlyList<HomeroomClassResponse>> GetHomeroomClassesAsync(Guid teacherUserId);

    // Trả các ảnh vừa chia sẻ. null khi lớp không tồn tại hoặc không phải lớp mình phụ trách → 404
    Task<IReadOnlyList<ActivityPhotoResponse>?> ShareActivityPhotosAsync(Guid classId,
        ShareActivityPhotosRequest request, Guid teacherUserId);

    // Một trang ảnh của lớp con đang học. null khi trẻ không tồn tại hoặc không liên kết với phụ huynh này → 404
    Task<ActivityPhotoPageResponse?> GetChildActivityPhotosForGuardianAsync(Guid childId,
        ActivityPhotoListQuery query, Guid parentUserId);
}
