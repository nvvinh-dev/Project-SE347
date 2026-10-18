namespace NhaTre.Application.Common;

// D23: "hôm nay" của nghiệp vụ tính theo giờ Việt Nam, không theo múi giờ của máy chủ.
// Service nào cần ngày hiện tại thì gọi ở đây, không tự khai báo múi giờ riêng
public static class VietnamTime
{
    private static readonly TimeZoneInfo TimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

    // Nhận thời điểm UTC thay vì tự đọc đồng hồ, để ngày và giờ của một bản ghi lấy từ cùng một lần đọc
    public static DateOnly DateOf(DateTime utcNow)
        => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utcNow, TimeZone));

    // Tháng theo giờ Việt Nam chứa thời điểm utcNow, ranh giới trả ra dạng UTC nửa mở [StartUtc, EndUtc)
    public static (int Year, int Month, DateTime StartUtc, DateTime EndUtc) MonthOf(DateTime utcNow)
    {
        var nowVietnam = TimeZoneInfo.ConvertTimeFromUtc(utcNow, TimeZone);
        var startVietnam = new DateTime(nowVietnam.Year, nowVietnam.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);

        return (startVietnam.Year, startVietnam.Month,
            TimeZoneInfo.ConvertTimeToUtc(startVietnam, TimeZone),
            TimeZoneInfo.ConvertTimeToUtc(startVietnam.AddMonths(1), TimeZone));
    }
}
