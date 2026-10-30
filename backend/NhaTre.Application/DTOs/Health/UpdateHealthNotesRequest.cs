using System.Text.Json.Serialization;

namespace NhaTre.Application.DTOs.Health;

// FR-HEALTH-06: Y tế ghi lưu ý sức khỏe của trẻ; trẻ lấy từ route. Chỉ có một trường, nên họ tên, ngày
// sinh hay lớp client gửi kèm đều bị bỏ qua (UC-HEALTH-05 A2). null, chuỗi rỗng hay chỉ có khoảng trắng
// là xóa trắng lưu ý (D39 mục 14). Trường bắt buộc có mặt trong JSON: thiếu trường hay gõ sai tên trường
// thì 400, không bị hiểu thành null rồi xóa mất lưu ý đang có
public record UpdateHealthNotesRequest([property: JsonRequired] string? HealthNotes);
