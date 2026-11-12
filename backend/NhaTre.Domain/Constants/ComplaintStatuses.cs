namespace NhaTre.Domain.Constants;

/// Ba trạng thái của phản ánh — chốt ở D39 mục 18, khớp CHECK CK_Complaint_Status (D51).
/// Phản ánh mới luôn New do server đặt; Admin chuyển New → InProgress → Resolved, hoặc thẳng
/// New → Resolved. Đã Resolved thì không đổi được nữa.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class ComplaintStatuses
{
    public const string New = "New";               // Mới gửi
    public const string InProgress = "InProgress"; // Đang xử lý
    public const string Resolved = "Resolved";     // Đã xử lý xong

    public static readonly IReadOnlyList<string> All = new[]
    {
        New, InProgress, Resolved,
    };

    // Hai trạng thái Admin được chuyển tới; New chỉ do server đặt lúc tạo
    public static readonly IReadOnlyList<string> HandlingTargets = new[]
    {
        InProgress, Resolved,
    };

    public static bool IsValid(string? status) => status is not null && All.Contains(status);

    public static bool IsHandlingTarget(string? status) => status is not null && HandlingTargets.Contains(status);
}
