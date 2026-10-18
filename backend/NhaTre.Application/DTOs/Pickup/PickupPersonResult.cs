namespace NhaTre.Application.DTOs.Pickup;

// Thêm, sửa, xóa người đón thất bại theo nhiều kiểu khác status code và message (404 ngoài phạm vi,
// 409 theo từng quy tắc BR-PICKUP), nên Service trả kết quả kèm lý do để Controller chọn
public enum PickupPersonOutcome
{
    Success,
    ChildNotFound,
    PickupPersonNotFound,
    PrimaryAlreadyExists,
    BackupAlreadyExists,
    NoPrimaryPerson,
    DuplicateCitizenId,
    CannotDeletePrimary,
    ChangedConcurrently
}

// Person chỉ có khi thêm hoặc sửa thành công; xóa thành công không trả người đón
public record PickupPersonResult(PickupPersonOutcome Outcome, PickupPersonResponse? Person = null);
