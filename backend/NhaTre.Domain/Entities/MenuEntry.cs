namespace NhaTre.Domain.Entities;

public class MenuEntry
{
    public Guid Id { get; set; }
    public Guid WeeklyMenuId { get; set; }
    public short DayOfWeek { get; set; }
    public string Description { get; set; } = null!;

    public WeeklyMenu WeeklyMenu { get; set; } = null!;
}