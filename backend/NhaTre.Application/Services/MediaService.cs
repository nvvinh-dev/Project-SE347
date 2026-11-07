using NhaTre.Application.DTOs.Media;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class MediaService : IMediaService
{
    private readonly IMediaRepository _mediaRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly INotificationService _notificationService;
    private readonly IChildGuardianRepository _childGuardianRepository;

    public MediaService(IMediaRepository mediaRepository, IFileStorageService fileStorageService,
        INotificationService notificationService, IChildGuardianRepository childGuardianRepository)
    {
        _mediaRepository = mediaRepository;
        _fileStorageService = fileStorageService;
        _notificationService = notificationService;
        _childGuardianRepository = childGuardianRepository;
    }

    // FR-MEDIA-01, AC-MEDIA-01. Validator đã kiểm số lượng, định dạng và dung lượng ảnh. Lớp không tồn tại hay
    // không phải lớp mình → 404 (AC-MEDIA-03), kiểm trước khi upload nên không file nào lên Storage. Người tải
    // lên và thời điểm do backend quyết định (D44 mục 2); các ảnh của một lần chia sẻ cùng một thời điểm
    public async Task<IReadOnlyList<ActivityPhotoResponse>?> ShareActivityPhotosAsync(Guid classId,
        ShareActivityPhotosRequest request, Guid teacherUserId)
    {
        var homeroomClass = await _mediaRepository.FindHomeroomClassAsync(classId, teacherUserId);
        if (homeroomClass is null)
            return null;

        var uploadedAt = DateTime.UtcNow;
        var newPhotos = new List<ActivityPhoto>(request.Photos.Count);
        var saved = false;
        IReadOnlyList<ActivityPhotoResponse> response;
        try
        {
            foreach (var photo in request.Photos)
            {
                using var content = photo.OpenReadStream();
                var fileReference = await _fileStorageService.UploadAsync(content, StorageFolders.Activities,
                    photo.ContentType);
                newPhotos.Add(new ActivityPhoto
                {
                    ClassId = homeroomClass.Id,
                    // Repository đã lọc lớp chủ nhiệm theo tài khoản đang đăng nhập, nên đây là hồ sơ teachers
                    // của chính người gọi
                    UploadedByTeacherId = homeroomClass.HomeroomTeacherId!.Value,
                    UploadedAt = uploadedAt,
                    FileReference = fileReference
                });
            }

            _mediaRepository.AddActivityPhotos(newPhotos);

            // Ký URL trước khi ghi database, như ảnh sự cố: bước này lỗi thì chưa lưu gì, giáo viên gửi lại
            // không bị trùng ảnh. Giữ thứ tự giáo viên gửi lên
            response = await SignPhotosAsync(newPhotos);

            await _mediaRepository.SaveChangesAsync();
            saved = true;
        }
        finally
        {
            // Một ảnh upload lỗi, ký URL lỗi hay ghi database lỗi thì xóa mọi ảnh đã lên bucket trong lần này,
            // không để file mồ côi
            if (!saved)
            {
                foreach (var photo in newPhotos)
                    await _fileStorageService.DeleteAsync(photo.FileReference);
            }
        }

        // D39 mục 6 sự kiện 4: lưu xong mới gửi phụ huynh của các trẻ trong lớp (AC-MEDIA-01). Một lần chia sẻ
        // một thông báo, không gửi riêng từng ảnh
        await _notificationService.NotifyParentsOfClassAsync(homeroomClass.Id,
            $"Giáo viên vừa chia sẻ {newPhotos.Count} ảnh hoạt động mới của {homeroomClass.Name}.");

        return response;
    }

    // FR-MEDIA-02, AC-MEDIA-02. Kiểm liên kết trước như hóa đơn (FR-TUITION-05) và sự cố (FR-INCIDENT-03) để
    // tách trẻ ngoài phạm vi (404, AC-MEDIA-04) với con mình chưa có ảnh nào (trang rỗng). Phụ huynh không
    // chọn lớp: ảnh luôn là của lớp con đang học (BR-MEDIA-02)
    public async Task<ActivityPhotoPageResponse?> GetChildActivityPhotosForGuardianAsync(Guid childId,
        ActivityPhotoListQuery query, Guid parentUserId)
    {
        if (!await _childGuardianRepository.LinkExistsAsync(childId, parentUserId))
            return null;

        var totalCount = await _mediaRepository.CountActivityPhotosOfChildForGuardianAsync(childId, parentUserId);

        // Tính bằng long vì page rất lớn nhân pageSize vượt int, như GetMyNotificationsAsync. Trang nằm sau trang
        // cuối thì không truy vấn; còn lại skip nhỏ hơn totalCount nên ép về int an toàn
        var skip = (long)(query.Page - 1) * query.PageSize;
        IReadOnlyList<ActivityPhoto> photos = [];
        if (skip < totalCount)
            photos = await _mediaRepository.GetActivityPhotosOfChildForGuardianAsync(childId, parentUserId,
                (int)skip, query.PageSize);

        // AC-SEC-12: chỉ ký URL sau khi đã kiểm phạm vi, và chỉ cho các ảnh của trang này
        return new ActivityPhotoPageResponse(await SignPhotosAsync(photos), query.Page, query.PageSize,
            totalCount);
    }

    // D53: mỗi ảnh một URL ký hạn 60 phút, giữ nguyên thứ tự truyền vào. Chỉ gọi sau khi đã kiểm phạm vi lớp
    private async Task<IReadOnlyList<ActivityPhotoResponse>> SignPhotosAsync(IEnumerable<ActivityPhoto> photos)
    {
        var photoResponses = new List<ActivityPhotoResponse>();
        foreach (var photo in photos)
            photoResponses.Add(new ActivityPhotoResponse(photo.Id, photo.UploadedAt,
                await _fileStorageService.GetSignedUrlAsync(photo.FileReference)));

        return photoResponses;
    }
}
