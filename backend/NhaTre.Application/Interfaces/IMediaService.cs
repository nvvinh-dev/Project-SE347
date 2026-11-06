using NhaTre.Application.DTOs.Media;

namespace NhaTre.Application.Interfaces;

public interface IMediaService
{
    // Trả các ảnh vừa chia sẻ. null khi lớp không tồn tại hoặc không phải lớp mình chủ nhiệm → 404
    Task<IReadOnlyList<ActivityPhotoResponse>?> ShareActivityPhotosAsync(Guid classId,
        ShareActivityPhotosRequest request, Guid teacherUserId);
}
