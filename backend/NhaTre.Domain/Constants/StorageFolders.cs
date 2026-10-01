namespace NhaTre.Domain.Constants;

/// Ba thư mục trong bucket "photos" — chốt ở D22, mỗi loại ảnh một thư mục.
/// Khóa lưu ở database gồm cả thư mục, ví dụ "incidents/<khóa do backend sinh>.jpg".
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class StorageFolders
{
    public const string Incidents = "incidents";       // incident_photos.file_reference
    public const string Activities = "activities";     // activity_photos.file_reference
    public const string PickupFaces = "pickup-faces";  // registered_pickup_persons.face_photo_reference

    public static readonly IReadOnlyList<string> All = new[]
    {
        Incidents, Activities, PickupFaces,
    };

    public static bool IsValid(string? folder) => folder is not null && All.Contains(folder);
}
