namespace NhaTre.Application.DTOs.Media;

// Url là URL ký hạn 60 phút, cấp sau khi đã kiểm phạm vi (D53). Không trả khóa file trên Storage, lớp hay
// người tải lên (D45): giáo viên đã chọn lớp trên route, phụ huynh chỉ xem được lớp con đang học
public record ActivityPhotoResponse(Guid Id, DateTime UploadedAtUtc, string Url);
