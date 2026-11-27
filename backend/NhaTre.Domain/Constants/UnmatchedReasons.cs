namespace NhaTre.Domain.Constants;

/// Bốn lý do một giao dịch ngân hàng không tự khớp được — chốt ở D21 mục 2, khớp CHECK
/// CK_BankTransaction_UnmatchedReason (D51). Lý do giữ nguyên kể cả khi Kế toán gán sau đó.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class UnmatchedReasons
{
    public const string NoInvoiceCode = "NoInvoiceCode";               // Nội dung không có mã của hóa đơn nào
    public const string AmbiguousInvoiceCode = "AmbiguousInvoiceCode"; // Nội dung có mã của từ hai hóa đơn trở lên
    public const string AmountMismatch = "AmountMismatch";             // Số tiền khác số tiền hóa đơn
    public const string InvoiceAlreadyPaid = "InvoiceAlreadyPaid";     // Hóa đơn đã thanh toán trước đó

    public static readonly IReadOnlyList<string> All = new[]
    {
        NoInvoiceCode, AmbiguousInvoiceCode, AmountMismatch, InvoiceAlreadyPaid,
    };

    public static bool IsValid(string? reason) => reason is not null && All.Contains(reason);
}
