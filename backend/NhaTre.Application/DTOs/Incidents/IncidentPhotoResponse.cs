namespace NhaTre.Application.DTOs.Incidents;

// Url là URL ký hạn 60 phút, cấp sau khi đã kiểm phạm vi (D53); hết hạn thì gọi lại API của sự cố.
// Không trả khóa file trên Storage (D45)
public record IncidentPhotoResponse(Guid Id, string Url);
