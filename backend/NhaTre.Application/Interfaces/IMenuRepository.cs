using NhaTre.Application.DTOs.Menu;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

// Method đọc trả thẳng DTO, các ngày xếp theo DayOfWeek
public interface IMenuRepository
{
    Task<WeeklyMenuResponse?> FindByWeekStartDateAsync(DateOnly weekStartDate);

    // Lưu thực đơn kèm các ngày. false khi tuần đã có thực đơn lúc INSERT chạy: unique week_start_date
    Task<bool> AddAsync(WeeklyMenu menu);

    // Thay các ngày của thực đơn bằng entries: ngày đã có thì sửa mô tả, ngày mới thì thêm, ngày không còn
    // trong entries thì gỡ. Trả ngày bắt đầu tuần của thực đơn; null khi không có thực đơn mang id này
    Task<DateOnly?> ReplaceEntriesAsync(Guid weeklyMenuId, IReadOnlyList<MenuEntry> entries);
}
