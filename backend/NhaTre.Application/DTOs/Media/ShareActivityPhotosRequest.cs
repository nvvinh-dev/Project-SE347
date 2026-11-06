using NhaTre.Application.Common;

namespace NhaTre.Application.DTOs.Media;

// FR-MEDIA-01: các ảnh giáo viên chia sẻ cho một lớp, Controller chép từ trường photos của multipart. Không
// có lớp, người tải lên, thời điểm hay khóa file: lớp lấy từ route, ba giá trị còn lại do backend quyết
// định (D44 mục 2)
public record ShareActivityPhotosRequest(IReadOnlyList<UploadedPhoto> Photos);
