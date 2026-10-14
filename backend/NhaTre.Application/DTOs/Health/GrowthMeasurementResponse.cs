namespace NhaTre.Application.DTOs.Health;

// D45: Y tế đã chọn trẻ trước khi ghi hay xem số đo, nên chỉ trả id trẻ, không kèm họ tên, lớp hay
// người ghi nhận. HeightCm hoặc WeightKg là null khi lần đo đó không ghi giá trị ấy
public record GrowthMeasurementResponse(
    Guid Id,
    Guid ChildId,
    DateTime MeasuredAtUtc,
    decimal? HeightCm,
    decimal? WeightKg);
