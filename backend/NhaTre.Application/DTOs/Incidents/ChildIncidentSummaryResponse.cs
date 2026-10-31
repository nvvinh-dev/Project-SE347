namespace NhaTre.Application.DTOs.Incidents;

// Một dòng trong danh sách sự cố phụ huynh xem (FR-INCIDENT-03): phụ huynh đã chọn trẻ trên URL nên không
// kèm id, họ tên hay lớp của trẻ, cũng không kèm giáo viên ghi nhận (D45). PhotoCount là số ảnh đã đính,
// 0 khi không có ảnh. Danh sách không kèm URL ảnh: phụ huynh mở từng sự cố để xem ảnh, như Y tế (D39 mục 9)
public record ChildIncidentSummaryResponse(
    Guid Id,
    DateTime OccurredAtUtc,
    string Description,
    int PhotoCount);
