namespace NhaTre.Domain.Entities;

// FR-CLASS-03: bảng tra cứu 3 khối cố định Mầm, Chồi, Lá (D39 mục 3), id smallint như roles.
// Khoảng tuổi nửa mở: trẻ thuộc khối khi MinAgeMonths <= tuổi < MaxAgeMonths
public class GradeLevel
{
    public short Id { get; set; }
    public string Name { get; set; } = null!;
    public int MinAgeMonths { get; set; }
    public int MaxAgeMonths { get; set; }
    public short SortOrder { get; set; }
}
