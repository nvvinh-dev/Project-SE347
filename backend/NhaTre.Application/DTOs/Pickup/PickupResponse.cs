namespace NhaTre.Application.DTOs.Pickup;

// D45: bản ghi đón về chỉ trả cách đón, họ tên đã chép lúc đón và thời điểm đón; không kèm số điện
// thoại hay số CCCD của người đón. ConfirmedByName chỉ có khi PickupMethod là PhoneConfirmed
public record PickupResponse(
    Guid Id,
    Guid AttendanceId,
    Guid ChildId,
    string ChildFullName,
    DateTime PickupTimeUtc,
    string PickupMethod,
    string PickerFullName,
    string? ConfirmedByName);
