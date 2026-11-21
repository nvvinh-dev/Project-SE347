using NhaTre.Application.DTOs.Menu;

namespace NhaTre.Application.Interfaces;

public interface IMenuService
{
    Task<WeeklyMenuResponse?> GetByWeekAsync(DateOnly weekStartDate);

    // FR-MENU-03: Phụ huynh xem thực đơn kèm ngày trùng dị nguyên của con mình (BR-MENU-02, BR-SCOPE-01)
    Task<WeeklyMenuResult> GetByWeekForChildAsync(DateOnly weekStartDate, Guid parentUserId, Guid childId);

    // null khi tuần đã có thực đơn
    Task<WeeklyMenuResponse?> CreateAsync(CreateWeeklyMenuRequest request);

    // null khi không tìm thấy thực đơn
    Task<WeeklyMenuResponse?> UpdateAsync(Guid id, UpdateWeeklyMenuRequest request);
}
