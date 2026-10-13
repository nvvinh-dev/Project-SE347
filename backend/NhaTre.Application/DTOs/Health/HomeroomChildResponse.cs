namespace NhaTre.Application.DTOs.Health;

// D45: giáo viên chỉ nhận id, họ tên và lưu ý sức khỏe của trẻ lớp mình; không kèm ngày sinh, lớp
// hay lịch sử sức khỏe. Id là childId các màn hình giáo viên gửi lại khi điểm danh, đón trẻ, ghi
// sức khỏe nhanh. HealthNotes là null khi trẻ không có lưu ý
public record HomeroomChildResponse(
    Guid Id,
    string FullName,
    string? HealthNotes);
