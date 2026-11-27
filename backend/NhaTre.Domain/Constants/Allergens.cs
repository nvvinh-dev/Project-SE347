namespace NhaTre.Domain.Constants;

/// Mười dị nguyên của danh mục cố định — chốt ở D39 mục 19, khớp dữ liệu khởi tạo của bảng allergens.
/// Id cố định 1–10 theo đúng thứ tự dưới đây; không có API tạo, sửa hay xóa. Thêm hay đổi một mã
/// phải kèm migration (D51). Frontend hiển thị tiếng Việt.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class Allergens
{
    public const string Milk = "Milk";             // Sữa bò và sản phẩm từ sữa
    public const string Egg = "Egg";               // Trứng
    public const string Peanut = "Peanut";         // Đậu phộng
    public const string TreeNut = "TreeNut";       // Hạt cây (điều, óc chó, hạnh nhân...)
    public const string Soy = "Soy";               // Đậu nành
    public const string Wheat = "Wheat";           // Lúa mì, gluten
    public const string Fish = "Fish";             // Cá
    public const string Crustacean = "Crustacean"; // Giáp xác (tôm, cua)
    public const string Mollusc = "Mollusc";       // Nhuyễn thể (mực, nghêu, sò)
    public const string Sesame = "Sesame";         // Mè

    // Thứ tự trong danh sách là id trong bảng allergens trừ 1 và cũng là sort_order
    public static readonly IReadOnlyList<string> All = new[]
    {
        Milk, Egg, Peanut, TreeNut, Soy, Wheat, Fish, Crustacean, Mollusc, Sesame,
    };

    public static bool IsValid(string? code) => code is not null && All.Contains(code);

    public static short ToId(string code)
    {
        var index = Array.IndexOf((string[])All, code);
        if (index < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(code), code, "Mã dị nguyên không có trong danh mục.");
        }

        return (short)(index + 1);
    }

    public static string FromId(short id)
    {
        if (id < 1 || id > All.Count)
        {
            throw new ArgumentOutOfRangeException(nameof(id), id, "Id dị nguyên không có trong danh mục.");
        }

        return All[id - 1];
    }
}
