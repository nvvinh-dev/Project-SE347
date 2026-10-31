namespace NhaTre.Application.DTOs.Menu;

// Thực đơn của một ngày trong tuần. DayOfWeek theo ISO 8601: 1 = thứ Hai ... 7 = Chủ nhật
public record MenuEntryRequest(int DayOfWeek, string Description);
