using Microsoft.EntityFrameworkCore;
using Npgsql;
using NhaTre.Application.DTOs.Menu;
using NhaTre.Application.Interfaces;
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
        return await _dbContext.WeeklyMenus
            .AsNoTracking()
            .Where(w => w.WeekStartDate == weekStartDate)
            .Select(w => new WeeklyMenuResponse(
                w.Id,
                w.WeekStartDate,
                w.MenuEntries
                    .OrderBy(e => e.DayOfWeek)
                    .Select(e => new MenuEntryResponse(e.DayOfWeek, e.Description))
                    .ToList()))
            .FirstOrDefaultAsync();
    }

    public async Task<bool> AddAsync(WeeklyMenu menu)
    {
        _dbContext.WeeklyMenus.Add(menu);

        try
        {
            await _dbContext.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Unique index trên week_start_date: request khác vừa tạo thực đơn cho tuần này. Bỏ theo dõi bản
            // ghi lỗi để một SaveChanges khác trong cùng request không thử ghi lại nó. Bỏ các ngày trước:
            // bỏ thực đơn trước thì EF coi là cắt quan hệ bắt buộc của các ngày còn theo dõi và ném lỗi.
            // Duyệt bản chép vì bỏ theo dõi một ngày thì EF rút ngày đó khỏi MenuEntries
            foreach (var entry in menu.MenuEntries.ToList())
                _dbContext.Entry(entry).State = EntityState.Detached;
            _dbContext.Entry(menu).State = EntityState.Detached;
            return false;
        }
    }

    public async Task<DateOnly?> ReplaceEntriesAsync(Guid weeklyMenuId, IReadOnlyList<MenuEntry> entries)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        // Khóa dòng thực đơn: hai Kế toán sửa cùng một tuần thì lần sau chờ lần trước commit rồi ghi đè, không
        // cùng thêm một ngày rồi vấp unique (weekly_menu_id, day_of_week). EF Core không có toán tử FOR UPDATE
        // nên viết SQL; giá trị truyền dạng tham số, không ghép chuỗi
        var weekStartDates = await _dbContext.Database
            .SqlQuery<DateOnly>($"SELECT week_start_date AS \"Value\" FROM weekly_menus WHERE id = {weeklyMenuId} FOR UPDATE")
            .ToListAsync();

        // Không có thực đơn thì thoát mà không commit: transaction tự rollback
        if (weekStartDates.Count == 0)
            return null;

        // Đọc sau khi đã khóa nên thấy đúng các ngày lần sửa trước vừa commit
        var currentEntries = await _dbContext.MenuEntries
            .Where(e => e.WeeklyMenuId == weeklyMenuId)
            .ToListAsync();

        foreach (var current in currentEntries.Where(c => entries.All(e => e.DayOfWeek != c.DayOfWeek)))
            _dbContext.MenuEntries.Remove(current);

        // Ngày đã có thì giữ dòng cũ và chỉ sửa mô tả, EF chỉ UPDATE khi mô tả thật sự đổi
        foreach (var entry in entries)
        {
            var current = currentEntries.FirstOrDefault(c => c.DayOfWeek == entry.DayOfWeek);

            if (current is null)
            {
                entry.WeeklyMenuId = weeklyMenuId;
                _dbContext.MenuEntries.Add(entry);
            }
            else
            {
                current.Description = entry.Description;
            }
        }

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
        return weekStartDates[0];
    }
}
