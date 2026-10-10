namespace NhaTre.Application.DTOs.Children;

// D45: phụ huynh chọn con chỉ cần id và họ tên, không kèm ngày sinh, lớp hay health_notes. Id là
// childId các màn hình phụ huynh gửi lại khi xem điểm danh, sức khỏe, người đón của trẻ đó
public record MyChildResponse(
    Guid Id,
    string FullName);
