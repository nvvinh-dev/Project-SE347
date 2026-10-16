namespace NhaTre.Application.DTOs.Health;

// D39 mục 1: đúng 3 trường của bản ghi sức khỏe nhanh, cùng trẻ được ghi nhận. Không có thời điểm
// hay người ghi nhận: recorded_at do server đặt, người ghi nhận lấy từ phiên đăng nhập (D44 mục 2)
public record QuickHealthStatusRequest(Guid ChildId, string Mood, decimal? TemperatureCelsius, string Notes);
