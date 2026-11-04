namespace NhaTre.Application.DTOs.Incidents;

// Một sự cố phụ huynh mở xem (FR-INCIDENT-03, AC-INCIDENT-07): mô tả, thời điểm và từng ảnh kèm URL ký hạn
// 60 phút (D53). Không kèm id, họ tên, lớp của trẻ hay giáo viên ghi nhận (D45). Photos rỗng khi sự cố không
// có ảnh (BR-INCIDENT-03)
public record ChildIncidentResponse(
    Guid Id,
    DateTime OccurredAtUtc,
    string Description,
    IReadOnlyList<IncidentPhotoResponse> Photos);
