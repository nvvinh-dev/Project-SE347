namespace NhaTre.Application.DTOs.Pickup;

// D45: giáo viên đối chiếu người đón chỉ nhận họ tên, mối liên hệ, số điện thoại, số CCCD và URL ký
// của ảnh khuôn mặt. Id là pickupPersonId gửi lại khi ghi nhận đón về; Priority theo
// PickupPersonPriorities (1 chính, 2 dự phòng) để giao diện gửi đúng pickupMethod. FacePhotoUrl hết
// hạn sau 60 phút (D53), hết hạn thì gọi lại API để nhận URL mới.
// FR-PICKUP-03: phụ huynh xem, thêm, sửa người đón của con mình nhận cùng các trường này
public record PickupPersonResponse(
    Guid Id,
    short Priority,
    string FullName,
    string Relationship,
    string PhoneNumber,
    string CitizenIdNumber,
    string FacePhotoUrl);
