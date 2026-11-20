namespace NhaTre.Domain.Entities;

// FR-HEALTH-08: dị nguyên của trẻ, chỉ Y tế ghi. Y tế thay toàn bộ danh sách nên dòng bị bỏ thì xóa,
// như class_teachers (D39 mục 19)
public class ChildAllergen
{
    public Guid ChildId { get; set; }
    public short AllergenId { get; set; }

    public Child Child { get; set; } = null!;
    public Allergen Allergen { get; set; } = null!;
}
