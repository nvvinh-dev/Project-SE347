using System.Text.Json.Serialization;

namespace NhaTre.Application.DTOs.Health;

// Một bản ghi trong lịch sử gộp Y tế xem (FR-HEALTH-04, D39 mục 9). Trường "type" đứng đầu cho biết
// bản ghi thuộc loại nào, sau đó là đúng các trường của loại đó, không có trường null của loại khác.
// OccurredAtUtc là thời điểm xảy ra sự cố, thời điểm ghi sức khỏe nhanh hoặc thời điểm đo, để giao
// diện xếp chung một trục thời gian. Không kèm lớp hay người ghi nhận (D40 mục 3, D45).
// JsonPropertyOrder đưa hai trường chung lên ngay sau "type": mặc định System.Text.Json ghi trường của
// lớp con trước lớp cha
[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(IncidentHistoryItemResponse), "Incident")]
[JsonDerivedType(typeof(QuickHealthStatusHistoryItemResponse), "QuickHealthStatus")]
[JsonDerivedType(typeof(GrowthMeasurementHistoryItemResponse), "GrowthMeasurement")]
public abstract record HealthHistoryItemResponse(
    [property: JsonPropertyOrder(-2)] Guid Id,
    [property: JsonPropertyOrder(-1)] DateTime OccurredAtUtc);

// PhotoCount là số ảnh đã đính, 0 khi không có ảnh. Lịch sử không kèm URL ảnh: Y tế mở sự cố qua
// GET /api/incidents/{id} để xem ảnh (D39 mục 9)
public sealed record IncidentHistoryItemResponse(
    Guid Id,
    DateTime OccurredAtUtc,
    string Description,
    int PhotoCount) : HealthHistoryItemResponse(Id, OccurredAtUtc);

// Mood là giá trị tiếng Anh trong HealthMoods, giao diện hiển thị tiếng Việt
public sealed record QuickHealthStatusHistoryItemResponse(
    Guid Id,
    DateTime OccurredAtUtc,
    string Mood,
    decimal? TemperatureCelsius,
    string Notes) : HealthHistoryItemResponse(Id, OccurredAtUtc);

// HeightCm hoặc WeightKg là null khi lần đo đó không ghi giá trị ấy
public sealed record GrowthMeasurementHistoryItemResponse(
    Guid Id,
    DateTime OccurredAtUtc,
    decimal? HeightCm,
    decimal? WeightKg) : HealthHistoryItemResponse(Id, OccurredAtUtc);
