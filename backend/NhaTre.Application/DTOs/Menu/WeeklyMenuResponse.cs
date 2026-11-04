namespace NhaTre.Application.DTOs.Menu;

// Kế toán và Phụ huynh nhận cùng một dạng: thực đơn là dữ liệu toàn trường (BR-MENU-02).
// Entries xếp theo ngày trong tuần, chỉ gồm những ngày có thực đơn
public record WeeklyMenuResponse(Guid Id, DateOnly WeekStartDate, IReadOnlyList<MenuEntryResponse> Entries);
