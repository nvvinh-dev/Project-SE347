using NhaTre.Application.DTOs.Menu;

namespace NhaTre.Application.Interfaces;

public interface IMenuService
{
    Task<WeeklyMenuResponse?> GetByWeekAsync(DateOnly weekStartDate);

    // null khi tuần đã có thực đơn
    Task<WeeklyMenuResponse?> CreateAsync(CreateWeeklyMenuRequest request);

    // null khi không tìm thấy thực đơn
    Task<WeeklyMenuResponse?> UpdateAsync(Guid id, UpdateWeeklyMenuRequest request);
}
