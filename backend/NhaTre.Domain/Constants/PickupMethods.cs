namespace NhaTre.Domain.Constants;

/// Ba cách đón trẻ — chốt ở D24 và D39 mục 11. Lưu chuỗi tiếng Anh, frontend hiển thị tiếng Việt.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class PickupMethods
{
    public const string Primary = "Primary"; // Người đón chính
    public const string Backup = "Backup"; // Người đón dự phòng
    public const string PhoneConfirmed = "PhoneConfirmed"; // Người khác đến đón, đã gọi xác nhận
    public static readonly IReadOnlyList<string> All = new[]
    {
        Primary, Backup, PhoneConfirmed
    };
    public static bool IsValid(string? method) => method is not null && All.Contains(method);
}
