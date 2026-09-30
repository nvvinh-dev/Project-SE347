namespace NhaTre.Domain.Entities;

public class RegisteredPickupPerson
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public short Priority { get; set; } // 1 = người đón chính, 2 = người dự phòng — CHECK ở DB (D24, D51)
    public string FullName { get; set; } = null!;
    public string Relationship { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;      // không ghi vào log (D45)
    public string CitizenIdNumber { get; set; } = null!;  // số CCCD — không ghi vào log (D45)
    public string FacePhotoReference { get; set; } = null!; // khóa file trong bucket private, không phải URL (D22, D53)
    public DateTime ConsentConfirmedAt { get; set; }      // giờ server lúc phụ huynh xác nhận đồng ý (D24)
    public Guid ConsentConfirmedByUserId { get; set; }    // phụ huynh đã xác nhận — lấy từ sub (D24, D44)

    public Child Child { get; set; } = null!;
}