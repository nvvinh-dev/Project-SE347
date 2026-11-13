namespace NhaTre.Application.DTOs.Media;

// Một lớp giáo viên đang đăng nhập phụ trách, để màn hình chia sẻ ảnh hoạt động chọn lớp và gửi classId.
// Chỉ id và tên: không kèm khoảng tuổi, giáo viên hay trẻ của lớp (D45)
public record HomeroomClassResponse(Guid Id, string Name);
