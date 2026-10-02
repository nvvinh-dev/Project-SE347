namespace NhaTre.Domain.Constants;

/// Giá trị cột security_events.detail của các sự kiện có detail cố định (D50).
/// Sự kiện không có trong danh sách này thì để detail rỗng.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class SecurityEventDetails
{
    public const string Linked = "linked";           // guardian_link_changed: tạo liên kết phụ huynh–trẻ
    public const string Unlinked = "unlinked";       // guardian_link_changed: gỡ liên kết
    public const string Activated = "activated";     // account_activation_changed: mở lại tài khoản
    public const string Deactivated = "deactivated"; // account_activation_changed: vô hiệu hóa tài khoản
}
