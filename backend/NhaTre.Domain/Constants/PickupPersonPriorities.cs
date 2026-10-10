namespace NhaTre.Domain.Constants;

/// Thứ tự ưu tiên của người đón đã đăng ký — chốt ở D24, khớp CHECK CK_RegisteredPickupPerson_Priority (D51).
/// KHÔNG gõ số tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class PickupPersonPriorities
{
    public const short Primary = 1; // Người đón chính
    public const short Backup = 2;  // Người đón dự phòng
}
