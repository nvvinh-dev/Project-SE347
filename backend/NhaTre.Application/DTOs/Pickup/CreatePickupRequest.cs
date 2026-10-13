namespace NhaTre.Application.DTOs.Pickup;

// PickupPersonId là người đón đã đăng ký mà giáo viên chọn: người đến đón khi Primary/Backup, người
// đã xác nhận qua điện thoại khi PhoneConfirmed (D39 mục 11). PickerFullName chỉ dùng khi
// PhoneConfirmed; với Primary/Backup giá trị client gửi bị bỏ qua, họ tên chép từ người đón đã đăng
// ký (D24, D44 mục 2). Không có bản điểm danh, giờ đón hay người ghi nhận: server tự xác định
public record CreatePickupRequest(Guid ChildId, string PickupMethod, Guid PickupPersonId, string? PickerFullName);
