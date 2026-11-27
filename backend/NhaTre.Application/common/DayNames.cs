namespace NhaTre.Application.Common;

// Tên ngày trong tuần theo ISO 8601 (1 = thứ Hai ... 7 = Chủ nhật), dùng chung cho câu báo lỗi của validator và
// nội dung thông báo. Viết "thứ Tư", không viết "ngày thứ 4" vì dễ đọc nhầm
public static class DayNames
{
    // Chỉ số 0 bỏ trống để tra thẳng bằng số ngày
    private static readonly string[] Names =
        { "", "thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy", "Chủ nhật" };

    // Gọi khi dayOfWeek đã nằm trong 1–7
    public static string Of(int dayOfWeek) => Names[dayOfWeek];
}
