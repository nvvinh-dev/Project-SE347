namespace NhaTre.Domain.Entities;

// Chỉ ghi, không sửa, không xóa, không có endpoint đọc (D50).
// Không lưu mật khẩu, token hay secret vào bất kỳ cột nào.
public class SecurityEvent
{
    public Guid Id { get; set; }
    public DateTime OccurredAt { get; set; }
    public string EventType { get; set; } = null!;
    public Guid? ActorUserId { get; set; } // rỗng khi đăng nhập thất bại
    public Guid? TargetUserId { get; set; }
    public string? TargetReference { get; set; }
    public string? IpAddress { get; set; }
    public string? Detail { get; set; }
}
