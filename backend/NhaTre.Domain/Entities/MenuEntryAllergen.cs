namespace NhaTre.Domain.Entities;

// FR-MENU-03: dị nguyên của một ngày thực đơn, ghi cùng transaction với thực đơn tuần (D39 mục 19)
public class MenuEntryAllergen
{
    public Guid MenuEntryId { get; set; }
    public short AllergenId { get; set; }

    public MenuEntry MenuEntry { get; set; } = null!;
    public Allergen Allergen { get; set; } = null!;
}
