namespace NhaTre.Domain.Constants;

/// Bốn giá trị tâm trạng của bản ghi "sức khỏe nhanh" — chốt ở D39 mục 1.
/// Lưu chuỗi tiếng Anh trong database, hiển thị tiếng Việt ở frontend,
/// cùng nguyên tắc với Roles (D20) để dữ liệu không phụ thuộc ngôn ngữ.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class HealthMoods
{
    public const string Happy = "Happy";     // Vui vẻ
    public const string Normal = "Normal";   // Bình thường
    public const string Tired = "Tired";     // Mệt
    public const string Fussy = "Fussy";     // Quấy khóc

    public static readonly IReadOnlyList<string> All = new[]
    {
        Happy, Normal, Tired, Fussy,
    };

    public static bool IsValid(string? mood) => mood is not null && All.Contains(mood);
}
