namespace NhaTre.Application.DTOs.Menu;

// FR-MENU-01: Kế toán gửi lại đủ các ngày của tuần. Ngày không có trong Entries bị gỡ khỏi thực đơn;
// tuần lấy từ thực đơn đã tạo, không đổi được
public record UpdateWeeklyMenuRequest(IReadOnlyList<MenuEntryRequest> Entries);
