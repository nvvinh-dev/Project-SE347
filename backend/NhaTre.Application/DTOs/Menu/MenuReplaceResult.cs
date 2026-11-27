namespace NhaTre.Application.DTOs.Menu;

// Kết quả sửa thực đơn: tuần của thực đơn và các ngày như trước khi sửa, để MenuService so tập trẻ bị trùng
// dị nguyên trước và sau (FR-MENU-03, D39 mục 6)
public record MenuReplaceResult(DateOnly WeekStartDate, IReadOnlyList<MenuDayData> PreviousDays);
