namespace NhaTre.Application.DTOs.Pickup;

// Priority theo PickupPersonPriorities (1 chính, 2 dự phòng): phụ huynh nói rõ đang thêm người nào,
// để thêm người chính thứ hai hay thêm người dự phòng khi chưa có người chính trả 409 (AC-PICKUP-11).
// Khi sửa không đổi được Priority nên PickupPersonRequest không có trường này
public record CreatePickupPersonRequest(
    short? Priority,
    string? FullName,
    string? Relationship,
    string? PhoneNumber,
    string? CitizenIdNumber,
    bool? ConsentConfirmed)
    : PickupPersonRequest(FullName, Relationship, PhoneNumber, CitizenIdNumber, ConsentConfirmed);
