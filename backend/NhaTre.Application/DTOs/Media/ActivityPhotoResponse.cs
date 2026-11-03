namespace NhaTre.Application.DTOs.Media;

// Url là URL ký hạn 60 phút, cấp sau khi đã kiểm phạm vi lớp (D53). Không trả khóa file trên Storage, lớp
// hay người tải lên (D45): người gọi đã chọn lớp trên route
public record ActivityPhotoResponse(Guid Id, DateTime UploadedAtUtc, string Url);
