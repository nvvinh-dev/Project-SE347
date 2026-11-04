namespace NhaTre.Application.DTOs.Health;

// FR-HEALTH-04: khi chọn trẻ, Y tế nhận id, họ tên, ngày sinh và lưu ý sức khỏe của trẻ (cùng dạng với
// danh sách trẻ cho Y tế chọn, không kèm lớp — AC-HEALTH-13), kèm lịch sử gộp mới nhất trước. Trẻ chưa
// có bản ghi nào thì Items rỗng
public record HealthHistoryResponse(
    SchoolChildResponse Child,
    IReadOnlyList<HealthHistoryItemResponse> Items);
