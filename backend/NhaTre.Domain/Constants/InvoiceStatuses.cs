namespace NhaTre.Domain.Constants;

/// Hai trạng thái của hóa đơn — chốt ở D40 mục 4, khớp CHECK CK_Invoice_Status (D51).
/// Hóa đơn mới luôn Unpaid do server đặt (BR-TUITION-09); chỉ chuyển sang Paid khi
/// Kế toán ghi nhận thanh toán (D21), không có chiều ngược lại.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class InvoiceStatuses
{
    public const string Unpaid = "unpaid"; // Chưa thanh toán
    public const string Paid = "paid";     // Đã thanh toán

    public static readonly IReadOnlyList<string> All = new[]
    {
        Unpaid, Paid,
    };

    public static bool IsValid(string? status) => status is not null && All.Contains(status);
}
