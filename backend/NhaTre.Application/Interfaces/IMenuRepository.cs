using NhaTre.Application.DTOs.Menu;

namespace NhaTre.Application.Interfaces;

// Method đọc trả thẳng DTO, các ngày xếp theo DayOfWeek, mã dị nguyên xếp theo thứ tự danh mục
public interface IMenuRepository
{
    // MatchedAllergenCodes của các ngày luôn null; MenuService tự tính khi Phụ huynh xem kèm childId
    Task<WeeklyMenuResponse?> FindByWeekStartDateAsync(DateOnly weekStartDate);

    // Lưu thực đơn kèm các ngày và dị nguyên của từng ngày. Trả id thực đơn; null khi tuần đã có thực đơn
    // lúc INSERT chạy: unique week_start_date
    Task<Guid?> AddAsync(DateOnly weekStartDate, IReadOnlyList<MenuDayData> days);

    // Thay các ngày của thực đơn bằng days: ngày đã có thì sửa mô tả và dị nguyên, ngày mới thì thêm, ngày
    // không còn trong days thì gỡ. menu_entries.updated_at chỉ đổi ở ngày có mô tả hoặc dị nguyên đổi.
    // null khi không có thực đơn mang id này
    Task<MenuReplaceResult?> ReplaceEntriesAsync(Guid weeklyMenuId, IReadOnlyList<MenuDayData> days);

    // Trẻ có liên kết với phụ huynh này trong child_guardians (BR-SCOPE-01)
    Task<bool> IsGuardianOfChildAsync(Guid parentUserId, Guid childId);

    Task<IReadOnlyList<string>> GetChildAllergenCodesAsync(Guid childId);

    // Các trẻ có ít nhất một dị nguyên trong allergenCodes, mỗi trẻ kèm toàn bộ dị nguyên của mình
    Task<IReadOnlyList<ChildAllergenProfile>> FindChildrenWithAnyAllergenAsync(IReadOnlyCollection<string> allergenCodes);

    // Mã → tên tiếng Việt trong bảng allergens, để soạn nội dung thông báo
    Task<IReadOnlyDictionary<string, string>> GetAllergenNamesAsync();
}
