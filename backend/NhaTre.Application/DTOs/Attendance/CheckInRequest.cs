namespace NhaTre.Application.DTOs.Attendance;

// Không có ngày hay giờ: attendance_date và check_in_time do server đặt, giá trị client gửi kèm
// bị bỏ qua (D23, D44 mục 2). Người ghi nhận lấy từ phiên đăng nhập.
public record CheckInRequest(Guid ChildId, string Status);
