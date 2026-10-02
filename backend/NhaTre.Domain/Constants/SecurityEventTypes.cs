namespace NhaTre.Domain.Constants;

/// Tám sự kiện ghi vào security_events — danh sách đóng của D50, khớp CHECK
/// CK_SecurityEvent_EventType. Thêm sự kiện mới phải sửa cả D50 lẫn CHECK trong database.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class SecurityEventTypes
{
    public const string LoginSucceeded = "login_succeeded";
    public const string LoginFailed = "login_failed";
    public const string Logout = "logout";
    public const string RoleChanged = "role_changed";
    public const string AccountActivationChanged = "account_activation_changed";
    public const string PasswordResetByAdmin = "password_reset_by_admin";
    public const string InvoiceMarkedPaid = "invoice_marked_paid";
    public const string GuardianLinkChanged = "guardian_link_changed";
}
