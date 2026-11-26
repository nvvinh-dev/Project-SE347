namespace NhaTre.Domain.Constants;

/// Lý do một trẻ bị bỏ qua khi lập hóa đơn hàng loạt (FR-TUITION-10, BR-TUITION-17).
/// Không lưu vào database, chỉ trả trong kết quả xem trước và kết quả lập; frontend hiển thị tiếng Việt.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class InvoiceSkipReasons
{
    public const string DuplicateDescription = "DuplicateDescription"; // Trẻ đã có hóa đơn cùng mô tả

    public static readonly IReadOnlyList<string> All = new[]
    {
        DuplicateDescription,
    };

    public static bool IsValid(string? reason) => reason is not null && All.Contains(reason);
}
