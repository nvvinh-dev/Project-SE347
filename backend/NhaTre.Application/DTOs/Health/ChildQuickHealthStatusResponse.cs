namespace NhaTre.Application.DTOs.Health;

// Bản ghi sức khỏe nhanh phụ huynh xem (FR-HEALTH-05): không kèm trẻ hay giáo viên ghi nhận (D45).
// RecordedAtUtc là lúc giáo viên ghi (giờ server). Mood là giá trị tiếng Anh trong HealthMoods, giao diện
// hiển thị tiếng Việt
public record ChildQuickHealthStatusResponse(
    Guid Id,
    DateTime RecordedAtUtc,
    string Mood,
    decimal? TemperatureCelsius,
    string Notes);
