namespace NhaTre.Application.DTOs.Menu;

// Dữ liệu một ngày thực đơn trao đổi giữa MenuService và MenuRepository, không trả ra client.
// Description đã Trim; AllergenCodes là mã trong danh mục Allergens, không lặp
public record MenuDayData(int DayOfWeek, string Description, IReadOnlyList<string> AllergenCodes);
