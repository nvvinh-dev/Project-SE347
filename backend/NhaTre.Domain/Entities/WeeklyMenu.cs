namespace NhaTre.Domain.Entities;

public class WeeklyMenu
{
    public Guid Id { get; set; }
    public DateOnly WeekStartDate { get; set; }

    public ICollection<MenuEntry> MenuEntries { get; set; } = new List<MenuEntry>();
}