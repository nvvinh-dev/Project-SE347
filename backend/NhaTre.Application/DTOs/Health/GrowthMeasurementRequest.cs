namespace NhaTre.Application.DTOs.Health;

// FR-HEALTH-02, FR-HEALTH-03: một lần đo có chiều cao, cân nặng hoặc cả hai (BR-HEALTH-05). Trẻ lấy
// từ route. Không có thời điểm hay người ghi nhận: measured_at do server đặt, người ghi nhận lấy từ
// phiên đăng nhập (D44 mục 2)
public record GrowthMeasurementRequest(decimal? HeightCm, decimal? WeightKg);
