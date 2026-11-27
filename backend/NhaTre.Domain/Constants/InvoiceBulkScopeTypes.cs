namespace NhaTre.Domain.Constants;

/// Ba phạm vi lập hóa đơn hàng loạt (FR-TUITION-10, D39 mục 21): một lớp, một khối hoặc toàn trường.
/// Chỉ tính trẻ đang ở lớp chưa lưu trữ.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class InvoiceBulkScopeTypes
{
    public const string Class = "class";           // Một lớp, id là Guid của lớp
    public const string GradeLevel = "gradeLevel"; // Một khối, id là id của khối
    public const string School = "school";         // Toàn trường, không gửi id

    public static readonly IReadOnlyList<string> All = new[]
    {
        Class, GradeLevel, School,
    };

    public static bool IsValid(string? type) => type is not null && All.Contains(type);
}
