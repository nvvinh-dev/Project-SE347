using Microsoft.EntityFrameworkCore;
using Npgsql;
using NhaTre.Application.DTOs.Menu;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class MenuRepository : IMenuRepository
{
    private readonly AppDbContext _dbContext;

    public MenuRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<WeeklyMenuResponse?> FindByWeekStartDateAsync(DateOnly weekStartDate)
    {
        var menu = await _dbContext.WeeklyMenus
            .AsNoTracking()
            .Where(w => w.WeekStartDate == weekStartDate)
            .Select(w => new { w.Id, w.WeekStartDate })
            .FirstOrDefaultAsync();

        if (menu is null)
            return null;

        // menu_entry_allergens không có navigation từ MenuEntry nên đọc riêng theo id thực đơn rồi ghép
        var entries = await _dbContext.MenuEntries
            .AsNoTracking()
            .Where(e => e.WeeklyMenuId == menu.Id)
            .OrderBy(e => e.DayOfWeek)
            .Select(e => new { e.Id, e.DayOfWeek, e.Description })
            .ToListAsync();

        var allergenRows = await LoadAllergenRowsAsync(entries.Select(e => e.Id).ToList());

        return new WeeklyMenuResponse(menu.Id, menu.WeekStartDate, entries
            .Select(e => new MenuEntryResponse(e.DayOfWeek, e.Description, ToCodes(allergenRows, e.Id)))
            .ToList());
    }

    public async Task<Guid?> AddAsync(DateOnly weekStartDate, IReadOnlyList<MenuDayData> days)
    {
        var now = DateTime.UtcNow;
        var menu = new WeeklyMenu { WeekStartDate = weekStartDate };
        var allergenRows = new List<MenuEntryAllergen>();

        foreach (var day in days)
        {
            var entry = new MenuEntry { DayOfWeek = (short)day.DayOfWeek, Description = day.Description, UpdatedAt = now };
            menu.MenuEntries.Add(entry);
            allergenRows.AddRange(day.AllergenCodes.Select(code => new MenuEntryAllergen
            {
                MenuEntry = entry,
                AllergenId = Allergens.ToId(code)
            }));
        }

        // Thực đơn, các ngày và dị nguyên ghi trong một SaveChanges nên cùng một transaction (D39 mục 19)
        _dbContext.WeeklyMenus.Add(menu);
        _dbContext.MenuEntryAllergens.AddRange(allergenRows);

        try
        {
            await _dbContext.SaveChangesAsync();
            return menu.Id;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Unique index trên week_start_date: request khác vừa tạo thực đơn cho tuần này. Bỏ theo dõi bản
            // ghi lỗi để một SaveChanges khác trong cùng request không thử ghi lại nó. Bỏ từ con lên cha: bỏ
            // cha trước thì EF coi là cắt quan hệ bắt buộc của con còn theo dõi và ném lỗi. Duyệt bản chép vì
            // bỏ theo dõi một ngày thì EF rút ngày đó khỏi MenuEntries
            foreach (var row in allergenRows)
                _dbContext.Entry(row).State = EntityState.Detached;
            foreach (var entry in menu.MenuEntries.ToList())
                _dbContext.Entry(entry).State = EntityState.Detached;
            _dbContext.Entry(menu).State = EntityState.Detached;
            return null;
        }
    }

    public async Task<MenuReplaceResult?> ReplaceEntriesAsync(Guid weeklyMenuId, IReadOnlyList<MenuDayData> days)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        // Khóa dòng thực đơn: hai Kế toán sửa cùng một tuần thì lần sau chờ lần trước commit rồi ghi đè, không
        // cùng thêm một ngày rồi vấp unique (weekly_menu_id, day_of_week). EF Core không có toán tử FOR UPDATE
        // nên viết SQL; giá trị truyền dạng tham số, không ghép chuỗi. Khóa này cũng làm tập ngày cũ đọc dưới
        // đây đúng là bản lần sửa trước vừa commit, nên hai lần sửa đồng thời không cùng bỏ sót hay gửi trùng
        // thông báo trùng dị ứng
        var weekStartDates = await _dbContext.Database
            .SqlQuery<DateOnly>($"SELECT week_start_date AS \"Value\" FROM weekly_menus WHERE id = {weeklyMenuId} FOR UPDATE")
            .ToListAsync();

        // Không có thực đơn thì thoát mà không commit: transaction tự rollback
        if (weekStartDates.Count == 0)
            return null;

        var currentEntries = await _dbContext.MenuEntries
            .Where(e => e.WeeklyMenuId == weeklyMenuId)
            .ToListAsync();

        var currentEntryIds = currentEntries.Select(e => e.Id).ToList();
        var currentAllergenRows = await _dbContext.MenuEntryAllergens
            .Where(ma => currentEntryIds.Contains(ma.MenuEntryId))
            .ToListAsync();

        var previousDays = currentEntries
            .OrderBy(e => e.DayOfWeek)
            .Select(e => new MenuDayData(e.DayOfWeek, e.Description, ToCodes(currentAllergenRows, e.Id)))
            .ToList();

        var now = DateTime.UtcNow;

        // Ngày bị gỡ: xóa dị nguyên của ngày trước vì khóa ngoại Restrict; EF xóa con trước cha trong cùng lần lưu
        foreach (var current in currentEntries.Where(c => days.All(d => d.DayOfWeek != c.DayOfWeek)))
        {
            _dbContext.MenuEntryAllergens.RemoveRange(currentAllergenRows.Where(ma => ma.MenuEntryId == current.Id));
            _dbContext.MenuEntries.Remove(current);
        }

        foreach (var day in days)
        {
            var newIds = day.AllergenCodes.Select(Allergens.ToId).ToHashSet();
            var current = currentEntries.FirstOrDefault(c => c.DayOfWeek == day.DayOfWeek);

            if (current is null)
            {
                var entry = new MenuEntry
                {
                    WeeklyMenuId = weeklyMenuId,
                    DayOfWeek = (short)day.DayOfWeek,
                    Description = day.Description,
                    UpdatedAt = now
                };
                _dbContext.MenuEntries.Add(entry);
                _dbContext.MenuEntryAllergens.AddRange(newIds.Select(id => new MenuEntryAllergen { MenuEntry = entry, AllergenId = id }));
                continue;
            }

            // Ngày đã có thì giữ dòng cũ; chỉ đổi mô tả, dị nguyên và updated_at khi thật sự có thay đổi, vì
            // updated_at mới hơn lần xác nhận của giáo viên làm cảnh báo về chưa xác nhận (D39 mục 19)
            var oldRows = currentAllergenRows.Where(ma => ma.MenuEntryId == current.Id).ToList();
            var oldIds = oldRows.Select(ma => ma.AllergenId).ToHashSet();
            var allergensChanged = !oldIds.SetEquals(newIds);

            if (allergensChanged)
            {
                _dbContext.MenuEntryAllergens.RemoveRange(oldRows.Where(ma => !newIds.Contains(ma.AllergenId)));
                _dbContext.MenuEntryAllergens.AddRange(newIds
                    .Where(id => !oldIds.Contains(id))
                    .Select(id => new MenuEntryAllergen { MenuEntryId = current.Id, AllergenId = id }));
            }

            if (allergensChanged || current.Description != day.Description)
            {
                current.Description = day.Description;
                current.UpdatedAt = now;
            }
        }

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
        return new MenuReplaceResult(weekStartDates[0], previousDays);
    }

    public async Task<bool> IsGuardianOfChildAsync(Guid parentUserId, Guid childId)
    {
        return await _dbContext.ChildGuardians
            .AnyAsync(cg => cg.ChildId == childId && cg.GuardianUserId == parentUserId);
    }

    public async Task<IReadOnlyList<string>> GetChildAllergenCodesAsync(Guid childId)
    {
        var ids = await _dbContext.ChildAllergens
            .AsNoTracking()
            .Where(ca => ca.ChildId == childId)
            .Select(ca => ca.AllergenId)
            .ToListAsync();

        return ids.Order().Select(Allergens.FromId).ToList();
    }

    public async Task<IReadOnlyList<ChildAllergenProfile>> FindChildrenWithAnyAllergenAsync(IReadOnlyCollection<string> allergenCodes)
    {
        var ids = allergenCodes.Select(Allergens.ToId).ToList();

        var rows = await _dbContext.ChildAllergens
            .AsNoTracking()
            .Where(ca => _dbContext.ChildAllergens.Any(m => m.ChildId == ca.ChildId && ids.Contains(m.AllergenId)))
            .Select(ca => new { ca.ChildId, ca.Child.FullName, ca.AllergenId })
            .ToListAsync();

        return rows
            .GroupBy(r => new { r.ChildId, r.FullName })
            .Select(g => new ChildAllergenProfile(
                g.Key.ChildId,
                g.Key.FullName,
                g.Select(r => r.AllergenId).Order().Select(Allergens.FromId).ToList()))
            .ToList();
    }

    public async Task<IReadOnlyDictionary<string, string>> GetAllergenNamesAsync()
    {
        return await _dbContext.Allergens
            .AsNoTracking()
            .ToDictionaryAsync(a => a.Code, a => a.Name);
    }

    private async Task<List<MenuEntryAllergen>> LoadAllergenRowsAsync(IReadOnlyList<Guid> entryIds)
    {
        return await _dbContext.MenuEntryAllergens
            .AsNoTracking()
            .Where(ma => entryIds.Contains(ma.MenuEntryId))
            .ToListAsync();
    }

    private static IReadOnlyList<string> ToCodes(IEnumerable<MenuEntryAllergen> rows, Guid entryId)
        => rows
            .Where(ma => ma.MenuEntryId == entryId)
            .Select(ma => ma.AllergenId)
            .Order()
            .Select(Allergens.FromId)
            .ToList();
}
