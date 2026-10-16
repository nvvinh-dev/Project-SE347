namespace NhaTre.Application.DTOs.Pickup;

// Ghi nhận đón về thất bại theo nhiều kiểu khác status code và message (404 ngoài phạm vi, 409 theo
// từng quy tắc BR-PICKUP), nên Service trả kết quả kèm lý do để Controller chọn
public enum PickupOutcome
{
    Success,
    ChildNotFound,
    NotCheckedInToday,
    ChildAbsent,
    AlreadyPickedUp,
    NoPrimaryPerson,
    PickupPersonNotFound,
    MethodMismatch
}

public record PickupResult(PickupOutcome Outcome, PickupResponse? Pickup = null);
