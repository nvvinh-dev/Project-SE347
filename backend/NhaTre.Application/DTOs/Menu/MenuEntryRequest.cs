namespace NhaTre.Application.DTOs.Menu;

// Thực đơn của một ngày trong tuần. DayOfWeek theo ISO 8601: 1 = thứ Hai ... 7 = Chủ nhật.
// AllergenCodes là mã trong danh mục Allergens (FR-MENU-03); không gửi hoặc gửi rỗng là ngày đó không có
// dị nguyên trong danh mục
public record MenuEntryRequest(int DayOfWeek, string Description, IReadOnlyList<string>? AllergenCodes = null);
