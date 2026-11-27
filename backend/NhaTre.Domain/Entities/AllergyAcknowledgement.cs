namespace NhaTre.Domain.Entities;

// FR-HEALTH-09: giáo viên xác nhận đã thấy cảnh báo dị ứng của trẻ trước bữa ăn (D39 mục 19).
// Chỉ ghi — không sửa, không xóa
public class AllergyAcknowledgement
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid AcknowledgedByTeacherId { get; set; } // hồ sơ teachers của sub (D44 mục 2)
    public DateOnly AckDate { get; set; }              // server đặt, hôm nay theo giờ Việt Nam
    public string[] AllergenCodes { get; set; } = []; // dị nguyên đang trùng lúc xác nhận
    public DateTime AcknowledgedAt { get; set; }

    public Child Child { get; set; } = null!;
    public Teacher AcknowledgedByTeacher { get; set; } = null!;
}
