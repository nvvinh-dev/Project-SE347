namespace NhaTre.Application.DTOs.Health;

// D45: Y tế chọn trẻ toàn trường, mỗi trẻ chỉ có id, họ tên, ngày sinh và lưu ý sức khỏe; không kèm
// lớp, điểm danh hay ngày nhập học (D40 mục 3). Id là childId các màn hình Y tế gửi lại khi ghi số đo,
// xem lịch sử, ghi lưu ý. Ngày sinh để phân biệt trẻ trùng tên. HealthNotes là null khi trẻ không có lưu ý
public record SchoolChildResponse(
    Guid Id,
    string FullName,
    DateOnly DateOfBirth,
    string? HealthNotes);
