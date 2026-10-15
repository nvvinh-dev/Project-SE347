namespace NhaTre.Application.DTOs.Pickup;

// FR-PICKUP-03, D24: 4 thông tin của người đón gửi dạng multipart, ảnh khuôn mặt đi riêng ở trường
// facePhoto. Dùng khi sửa; thêm mới dùng CreatePickupPersonRequest có thêm Priority.
// Không có trường thời điểm hay người xác nhận đồng ý: server lấy giờ server và sub (D24, D44 mục 2)
public record PickupPersonRequest(
    string? FullName,
    string? Relationship,
    string? PhoneNumber,
    string? CitizenIdNumber,
    bool? ConsentConfirmed);
