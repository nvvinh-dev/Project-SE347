namespace NhaTre.Domain.Entities;

// FR-HEALTH-08: bảng tra cứu 10 dị nguyên cố định (D39 mục 19), id smallint như roles
public class Allergen
{
    public short Id { get; set; }
    public string Code { get; set; } = null!; // Allergens — chuỗi tiếng Anh, duy nhất
    public string Name { get; set; } = null!;
    public short SortOrder { get; set; }
}
