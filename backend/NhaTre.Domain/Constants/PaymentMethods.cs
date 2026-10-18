namespace NhaTre.Domain.Constants;

/// Hai hình thức Kế toán ghi nhận khoản phụ huynh đã nộp — chốt ở D21, khớp CHECK
/// CK_Payment_Method (D51). Hệ thống không có cổng thanh toán; cả hai đều nộp ngoài hệ thống.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class PaymentMethods
{
    public const string Cash = "Cash";                 // Tiền mặt, không có mã giao dịch
    public const string BankTransfer = "BankTransfer"; // Chuyển khoản, bắt buộc mã giao dịch ngân hàng

    public static readonly IReadOnlyList<string> All = new[]
    {
        Cash, BankTransfer,
    };

    public static bool IsValid(string? method) => method is not null && All.Contains(method);
}
