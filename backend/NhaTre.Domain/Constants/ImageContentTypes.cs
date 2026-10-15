namespace NhaTre.Domain.Constants;

/// Hai định dạng ảnh được nhận — chốt ở D22 và D39 mục 5. Tầng Api kiểm tra Content-Type
/// theo danh sách này trước khi đẩy file xuống IFileStorageService (D44 mục 5).
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class ImageContentTypes
{
    public const string Jpeg = "image/jpeg";
    public const string Png = "image/png";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Jpeg, Png,
    };

    public static bool IsValid(string? contentType) => contentType is not null && All.Contains(contentType);

    // D44 mục 5: định dạng xét theo cả Content-Type lẫn phần mở rộng của tên file client gửi.
    // Tên file chỉ dùng để kiểm tra, file lưu trên Storage mang tên do backend sinh (D44 mục 2)
    public static readonly IReadOnlyList<string> FileExtensions = new[]
    {
        ".jpg", ".jpeg", ".png",
    };

    public static bool HasValidExtension(string? fileName)
        => fileName is not null
            && FileExtensions.Contains(Path.GetExtension(fileName), StringComparer.OrdinalIgnoreCase);

    // D39 mục 5: mỗi ảnh tối đa 5 MB
    public const long MaxFileSizeBytes = 5 * 1024 * 1024;
}
