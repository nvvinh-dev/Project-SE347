namespace NhaTre.Domain.Constants;

/// Ba trạng thái của giao dịch ngân hàng nhận qua webhook — chốt ở D21 mục 2, 3, khớp CHECK
/// CK_BankTransaction_Status (D51). Webhook đặt Matched hoặc Unmatched; Kế toán chỉ xử lý giao
/// dịch Unmatched (gán vào hóa đơn → Matched, hoặc đánh dấu → Dismissed). Matched và Dismissed
/// không đổi trạng thái nữa.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class BankTransactionStatuses
{
    public const string Matched = "Matched";     // Đã khớp với một hóa đơn
    public const string Unmatched = "Unmatched"; // Chưa khớp, chờ Kế toán xử lý
    public const string Dismissed = "Dismissed"; // Kế toán đánh dấu đã xử lý ngoài hệ thống

    public static readonly IReadOnlyList<string> All = new[]
    {
        Matched, Unmatched, Dismissed,
    };

    public static bool IsValid(string? status) => status is not null && All.Contains(status);
}
