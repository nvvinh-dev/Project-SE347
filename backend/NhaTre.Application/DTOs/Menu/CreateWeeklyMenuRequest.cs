namespace NhaTre.Application.DTOs.Menu;

// FR-MENU-01: Kế toán tạo thực đơn cho một tuần chưa có thực đơn. WeekStartDate là thứ Hai của tuần;
// Entries chỉ gồm những ngày có thực đơn
public record CreateWeeklyMenuRequest(DateOnly WeekStartDate, IReadOnlyList<MenuEntryRequest> Entries);
