namespace NhaTre.Domain.Entities;

public class MenuEntry
{
    public Guid Id { get; set; }
    public Guid WeeklyMenuId { get; set; }
    public short DayOfWeek { get; set; }
    public string Description { get; set; } = null!;
    // FR-MENU-03: đổi khi mô tả hoặc dị nguyên của ngày đổi; so với allergy_acknowledgements (D39 mục 19)
    public DateTime UpdatedAt { get; set; }

    public WeeklyMenu WeeklyMenu { get; set; } = null!;
}