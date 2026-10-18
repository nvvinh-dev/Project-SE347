namespace NhaTre.Application.DTOs.Incidents;

// FR-INCIDENT-01: trẻ, thời điểm xảy ra và mô tả (UC-INCIDENT-01). Không có người ghi nhận: lấy từ
// phiên đăng nhập (D44 mục 2). Thời điểm xảy ra do giáo viên nhập vì sự cố được ghi sau khi đã xử lý
// (D39 mục 15), phải kèm múi giờ, ví dụ "2026-10-16T01:30:00Z"
public record CreateIncidentRequest(Guid ChildId, DateTime OccurredAtUtc, string Description);
