namespace NhaTre.Application.Common;

// D23: "hôm nay" của nghiệp vụ tính theo giờ Việt Nam, không theo múi giờ của máy chủ.
// Service nào cần ngày hiện tại thì gọi ở đây, không tự khai báo múi giờ riêng
public static class VietnamTime
{
    private static readonly TimeZoneInfo TimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

    // Nhận thời điểm UTC thay vì tự đọc đồng hồ, để ngày và giờ của một bản ghi lấy từ cùng một lần đọc
    public static DateOnly DateOf(DateTime utcNow)
        => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utcNow, TimeZone));
}
