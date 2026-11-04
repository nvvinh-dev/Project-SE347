using NhaTre.Application.DTOs.Menu;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

// FR-MENU-01, FR-MENU-02: thực đơn tuần áp dụng chung cho toàn trường. Chỉ Kế toán tạo và sửa, không xóa
// (D40 mục 1); Phụ huynh chỉ xem, không lọc theo trẻ hay lớp (BR-MENU-02). Tạo và sửa thực đơn không sinh
// thông báo và không thuộc 8 sự kiện của security_events (D50)
public class MenuService : IMenuService
{
    private readonly IMenuRepository _menuRepository;

    public MenuService(IMenuRepository menuRepository)
    {
        _menuRepository = menuRepository;
    }

    public async Task<WeeklyMenuResponse?> GetByWeekAsync(DateOnly weekStartDate)
        => await _menuRepository.FindByWeekStartDateAsync(weekStartDate);

    public async Task<WeeklyMenuResponse?> CreateAsync(CreateWeeklyMenuRequest request)
    {
        var entries = ToEntries(request.Entries);
        var menu = new WeeklyMenu
        {
            WeekStartDate = request.WeekStartDate,
            MenuEntries = entries.ToList()
        };

        // Không kiểm trước tuần đã có thực đơn chưa: unique week_start_date chặn cả hai Kế toán cùng tạo một tuần
        if (!await _menuRepository.AddAsync(menu))
            return null;

        return ToResponse(menu.Id, menu.WeekStartDate, entries);
    }

    public async Task<WeeklyMenuResponse?> UpdateAsync(Guid id, UpdateWeeklyMenuRequest request)
    {
        var entries = ToEntries(request.Entries);
        var weekStartDate = await _menuRepository.ReplaceEntriesAsync(id, entries);

        return weekStartDate is null ? null : ToResponse(id, weekStartDate.Value, entries);
    }

    private static IReadOnlyList<MenuEntry> ToEntries(IReadOnlyList<MenuEntryRequest> entries)
        => entries
            .Select(e => new MenuEntry { DayOfWeek = (short)e.DayOfWeek, Description = e.Description.Trim() })
            .ToList();

    private static WeeklyMenuResponse ToResponse(Guid id, DateOnly weekStartDate, IEnumerable<MenuEntry> entries)
        => new(id, weekStartDate, entries
            .OrderBy(e => e.DayOfWeek)
            .Select(e => new MenuEntryResponse(e.DayOfWeek, e.Description))
            .ToList());
}
