using System.Globalization;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Menu;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Services;

// FR-MENU-01, FR-MENU-02: thực đơn tuần áp dụng chung cho toàn trường. Chỉ Kế toán tạo và sửa, không xóa
// (D40 mục 1); Phụ huynh chỉ xem, không lọc theo trẻ hay lớp (BR-MENU-02). Tạo và sửa thực đơn không thuộc
// 8 sự kiện của security_events (D50).
// FR-MENU-03: mỗi ngày có dị nguyên của món. Tạo hoặc sửa mà có trẻ bị trùng dị nguyên thì báo phụ huynh của
// trẻ đó và mọi Y tế đang hoạt động; trẻ có tập (ngày, dị nguyên) bị trùng không đổi thì không báo lại
// (D39 mục 6, sự kiện 7)
public class MenuService : IMenuService
{
    private readonly IMenuRepository _menuRepository;
    private readonly INotificationService _notificationService;

    public MenuService(IMenuRepository menuRepository, INotificationService notificationService)
    {
        _menuRepository = menuRepository;
        _notificationService = notificationService;
    }

    public async Task<WeeklyMenuResponse?> GetByWeekAsync(DateOnly weekStartDate)
        => await _menuRepository.FindByWeekStartDateAsync(weekStartDate);

    public async Task<WeeklyMenuResult> GetByWeekForChildAsync(DateOnly weekStartDate, Guid parentUserId, Guid childId)
    {
        // Kiểm trẻ trước thực đơn: trẻ không phải con mình thì 404 như nhau dù tuần có thực đơn hay chưa
        if (!await _menuRepository.IsGuardianOfChildAsync(parentUserId, childId))
            return new WeeklyMenuResult(WeeklyMenuOutcome.ChildNotFound);

        var menu = await _menuRepository.FindByWeekStartDateAsync(weekStartDate);
        if (menu is null)
            return new WeeklyMenuResult(WeeklyMenuOutcome.MenuNotFound);

        var childAllergenCodes = (await _menuRepository.GetChildAllergenCodesAsync(childId)).ToHashSet();
        var entries = menu.Entries
            .Select(e => e with
            {
                MatchedAllergenCodes = e.AllergenCodes.Where(childAllergenCodes.Contains).ToList()
            })
            .ToList();

        return new WeeklyMenuResult(WeeklyMenuOutcome.Success, menu with { Entries = entries });
    }

    public async Task<WeeklyMenuResponse?> CreateAsync(CreateWeeklyMenuRequest request)
    {
        var days = ToDays(request.Entries);

        // Không kiểm trước tuần đã có thực đơn chưa: unique week_start_date chặn cả hai Kế toán cùng tạo một tuần
        var id = await _menuRepository.AddAsync(request.WeekStartDate, days);
        if (id is null)
            return null;

        await NotifyAllergyConflictsAsync(request.WeekStartDate, previousDays: [], days);
        return ToResponse(id.Value, request.WeekStartDate, days);
    }

    public async Task<WeeklyMenuResponse?> UpdateAsync(Guid id, UpdateWeeklyMenuRequest request)
    {
        var days = ToDays(request.Entries);
        var result = await _menuRepository.ReplaceEntriesAsync(id, days);
        if (result is null)
            return null;

        await NotifyAllergyConflictsAsync(result.WeekStartDate, result.PreviousDays, days);
        return ToResponse(id, result.WeekStartDate, days);
    }

    // Gọi sau khi thực đơn đã lưu (D39 mục 6). So từng trẻ: trẻ mới bị trùng, hoặc tập (ngày, dị nguyên) bị
    // trùng khác lần trước, thì báo với toàn bộ ngày trùng của tuần. Trẻ hết trùng sau khi sửa thì không báo
    private async Task NotifyAllergyConflictsAsync(
        DateOnly weekStartDate, IReadOnlyList<MenuDayData> previousDays, IReadOnlyList<MenuDayData> days)
    {
        var menuCodes = previousDays.Concat(days).SelectMany(d => d.AllergenCodes).ToHashSet();
        if (menuCodes.Count == 0)
            return;

        var children = await _menuRepository.FindChildrenWithAnyAllergenAsync(menuCodes);
        var changedChildren = children
            .Select(child => (Child: child, Previous: FindConflicts(child, previousDays), Current: FindConflicts(child, days)))
            .Where(c => c.Current.Count > 0 && !c.Current.SetEquals(c.Previous))
            .ToList();

        if (changedChildren.Count == 0)
            return;

        var allergenNames = await _menuRepository.GetAllergenNamesAsync();

        foreach (var (child, _, current) in changedChildren)
        {
            var message = BuildConflictMessage(weekStartDate, child.FullName, current, allergenNames);
            await _notificationService.NotifyParentsOfChildAsync(child.ChildId, message);
            await _notificationService.NotifyActiveMedicalUsersAsync(message);
        }
    }

    private static HashSet<(int DayOfWeek, string AllergenCode)> FindConflicts(
        ChildAllergenProfile child, IReadOnlyList<MenuDayData> days)
        => days
            .SelectMany(d => d.AllergenCodes
                .Where(child.AllergenCodes.Contains)
                .Select(code => (d.DayOfWeek, code)))
            .ToHashSet();

    // Ví dụ: "Thực đơn tuần từ 23/11/2026 có món trùng dị ứng của bé Nguyễn Văn A: thứ Tư (Đậu phộng);
    // thứ Sáu (Đậu phộng / Trứng)." Ghi họ tên trẻ, ngày và tên dị nguyên, không ghi lớp (D39 mục 6). Tên dị
    // nguyên nối bằng " / " vì bản thân tên có dấu phẩy và ngoặc ("Lúa mì, gluten")
    private static string BuildConflictMessage(
        DateOnly weekStartDate,
        string childFullName,
        IEnumerable<(int DayOfWeek, string AllergenCode)> conflicts,
        IReadOnlyDictionary<string, string> allergenNames)
    {
        var dayParts = conflicts
            .GroupBy(c => c.DayOfWeek)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var names = g
                    .Select(c => c.AllergenCode)
                    .OrderBy(AllergenOrder)
                    .Select(code => allergenNames.TryGetValue(code, out var name) ? name : code);
                return $"{DayNames.Of(g.Key)} ({string.Join(" / ", names)})";
            });

        var week = weekStartDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
        return $"Thực đơn tuần từ {week} có món trùng dị ứng của bé {childFullName}: {string.Join("; ", dayParts)}.";
    }

    // Validator đã bảo đảm mã nằm trong danh mục và không lặp. Mã xếp theo thứ tự danh mục để response và
    // thông báo luôn cùng một thứ tự, không phụ thuộc thứ tự client gửi
    private static IReadOnlyList<MenuDayData> ToDays(IReadOnlyList<MenuEntryRequest> entries)
        => entries
            .Select(e => new MenuDayData(
                e.DayOfWeek,
                e.Description.Trim(),
                (e.AllergenCodes ?? []).OrderBy(AllergenOrder).ToList()))
            .ToList();

    private static int AllergenOrder(string code) => Allergens.ToId(code);

    private static WeeklyMenuResponse ToResponse(Guid id, DateOnly weekStartDate, IEnumerable<MenuDayData> days)
        => new(id, weekStartDate, days
            .OrderBy(d => d.DayOfWeek)
            .Select(d => new MenuEntryResponse(d.DayOfWeek, d.Description, d.AllergenCodes))
            .ToList());
}
