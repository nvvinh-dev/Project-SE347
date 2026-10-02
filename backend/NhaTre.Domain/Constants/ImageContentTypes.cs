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
}
