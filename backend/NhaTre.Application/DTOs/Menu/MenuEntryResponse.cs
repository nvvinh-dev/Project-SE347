namespace NhaTre.Application.DTOs.Menu;

// DayOfWeek theo ISO 8601: 1 = thứ Hai ... 7 = Chủ nhật
public record MenuEntryResponse(int DayOfWeek, string Description);
