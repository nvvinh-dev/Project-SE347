namespace NhaTre.Application.DTOs.Health;

// FR-HEALTH-05: phụ huynh xem sức khỏe của đúng trẻ đã chọn trên URL (UC-HEALTH-04), nên không kèm id,
// họ tên hay lớp của trẻ (D45). HealthNotes là null khi trẻ không có lưu ý. Hai danh sách mới nhất trước,
// rỗng khi con chưa có bản ghi nào (UC-HEALTH-04 E1)
public record ChildHealthResponse(
    string? HealthNotes,
    IReadOnlyList<ChildQuickHealthStatusResponse> QuickHealthStatuses,
    IReadOnlyList<ChildGrowthMeasurementResponse> GrowthMeasurements);
