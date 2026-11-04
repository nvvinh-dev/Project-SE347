namespace NhaTre.Application.DTOs.Health;

// Số đo phụ huynh xem (FR-HEALTH-05): như GrowthMeasurementResponse của Y tế nhưng bỏ ChildId, vì phụ
// huynh đã chọn trẻ trên URL (D45). HeightCm hoặc WeightKg là null khi lần đo đó không ghi giá trị ấy
public record ChildGrowthMeasurementResponse(
    Guid Id,
    DateTime MeasuredAtUtc,
    decimal? HeightCm,
    decimal? WeightKg);
